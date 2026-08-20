# BlackStone Chauffeur — Code Review

Scope: `blackstone-client` (84 files, ~12,400 lines) and `blackstone-server` (38 files, ~4,200 lines). Reviewed for correctness, security, structure, and documentation/comment consistency.

Overall, this codebase is in better shape than most projects this size without a dedicated backend engineer — error handling is consistent, the code style (no semicolons, single quotes) is applied uniformly everywhere, there's no leftover debug `console.log`, no `var`, no loose `==` equality, and a lot of the trickier business logic (permissions, pricing, notifications) has genuinely good "why" comments explaining non-obvious decisions. The problems below are real, but they're the kind you'd expect from a project that grew feature-by-feature without a second engineer reviewing along the way, not signs of careless work.

## Critical — fix these

### 1. SQL injection via arbitrary column names — `routes/vehicles.js`, `PATCH /:id`

```js
const fields = req.body || {}
const keys = Object.keys(fields)
const setClause = keys.map((k) => `${k} = ?`).join(', ')
await query(`UPDATE vehicles SET ${setClause} WHERE id = ?`, [...values, id])
```

Every other route in this app that builds a dynamic `SET` clause (`routes/bookings.js`, `routes/permissions.js`) does it by checking each field against a fixed, hardcoded list of allowed column names first. This route is the one exception: it takes the *keys of the request body itself* and drops them straight into the SQL string with no whitelist at all. A request body like `{"price = 0, description": "x"}` would be interpolated verbatim into the query. This route requires `can_manage_vehicles`, so it's not open to the public internet — but it means a second_admin account that's deliberately scoped to "vehicles only" (the whole point of this app's permission system) can run arbitrary SQL against any table, which defeats the permission boundary the rest of the app carefully enforces. This is a five-minute fix: build `setClause` from a fixed array of allowed vehicle columns the same way `bookings.js` does, and ignore/reject any other key.

### 2. Unescaped user input in HTML emails — `emails/templates/*.js`

```js
<tr><td>Customer</td><td>${customerName}</td></tr>
<tr><td>Pickup</td><td>${pickup}</td></tr>
```

`newBookingAdminTemplate` (and the other templates that follow the same pattern) interpolate `passenger_name`, `pickup`, `dropoff`, and `notes` directly into raw HTML with no escaping. All of these are free-text fields a customer or provider controls when creating a booking. Most email clients strip `<script>`, but they render arbitrary HTML/CSS fine — so a booking with a "name" of `<a href="http://evil.example">Click to confirm payment</a>` renders as a real clickable link inside the admin notification email, indistinguishable from legitimate content. Worth adding a small `escapeHtml()` helper and running every interpolated user-supplied value through it before it hits these templates.

## High — worth doing soon

### 3. No rate limiting anywhere
`POST /api/auth/login`, `/forgot-password`, and the public `/api/enquiries` endpoint have no rate limiting or lockout. `express-rate-limit` isn't in `package.json` at all. Right now nothing stops repeated password guesses against a known email, or someone scripting the public enquiry form to spam your inbox. This is a ~20-line addition (one middleware, applied to the auth and public routes).

### 4. Two near-identical "create a booking" forms
`components/AdminNewBookingTab.jsx` (817 lines) and the `NewBookingTab` function inside `pages/ProviderDashboard.jsx` (also several hundred lines) are the same form re-implemented twice — same fields, same add-on pricing constants, same WhatsApp-paste parser wiring, same validation shape — with small permission-driven differences (provider/driver attribution fields only show for admin). I ran into this directly while fixing the "Create Booking button does nothing" bug: the same disabled-button styling bug existed in both because it's the same logic typed out twice. Any future fix to one (like the scroll-to-top or toast notification just added) has to be remembered and applied to the other by hand, and it already wasn't consistently applied before this session. This should be one shared component parameterized by role, not two.

### 5. `routes/bookings.js` is 1,357 lines
One file currently owns booking creation (both customer and provider/admin paths), payment confirmation, cancellation, driver assignment, provider re-attribution, CSV/PDF export, and the person-level reporting endpoint. It's internally well-organized with good section comments, but at this size it's the single hardest file in the project to safely change without side effects — every edit this session that touched booking creation required reading hundreds of surrounding lines to be sure of the blast radius. Worth splitting along those seams (e.g. `bookings/create.js`, `bookings/lifecycle.js`, `bookings/reports.js`) once there's a natural pause in feature work.

### 6. `pages/Booking.jsx` is 1,166 lines
Same shape of problem on the client: one component owns the 3-step wizard, all pricing math, Google Places wiring, the Auckland/enquiry gating logic added this session, and the Stripe payment step. It works, but it's a lot of surface area held in one component's state. Splitting the three steps into their own components (even just visually, sharing state via props) would make the next change to any one step much lower-risk.

## Medium

### 7. No automated tests
No `*.test.js`/`*.spec.js` files anywhere, and no test script in either `package.json`. Given how much of this app is priced/paid transactions (Stripe, distance-tier pricing, night/traffic surcharges, the new Auckland-enquiry gating), even a handful of unit tests around `utils/pricing.js` and the booking-eligibility logic would catch regressions that currently can only be caught by manually re-testing in the browser — which is exactly what's been happening reactively all session.

### 8. No ESLint or Prettier config
The code is stylistically consistent in practice (verified — no mixed quote styles, no stray semicolons anywhere I sampled), but that's currently a matter of one person's habit rather than anything enforced. There's no `.eslintrc`/`eslint.config.js` or `.prettierrc` in either package. Worth adding before a second developer ever touches this repo, since nothing would currently catch a style drift or an accidental unused variable.

### 9. Pricing logic duplicated client + server
`blackstone-client/src/utils/pricing.js` and `blackstone-server/utils/pricing.js` implement the same tier lookup, night surcharge, and traffic surcharge formulas independently, kept in sync by comments ("mirrors ... exactly — this server copy is the authoritative one") rather than by sharing code. The comments are honest about the risk and the server copy is correctly treated as authoritative (client-supplied prices are never trusted), so this isn't a security problem — but it's a maintenance one: a future tweak to the night-surcharge rate that only gets made on one side will silently produce a mismatched estimate vs. actual charge. If this were ever moved to a shared TypeScript package or the client just requested a computed estimate from the server, this whole class of drift goes away.

### 10. Comment density is inconsistent across files
This was the most surprising finding — a lot of files (`routes/auth.js`, `routes/bookings.js`, `middleware/requirePermission.js`, most of the recently-touched client pages) have genuinely good comments that explain *why*, not just what. But it's not universal: `routes/vehicles.js`, for example, has only one-line route banners and no explanation at all for the non-obvious JSON-stringify-before-param handling or (per finding #1) the missing whitelist. The inconsistency tracks almost exactly with "was this file touched recently" rather than any deliberate standard — older, stable files were written once and never revisited, so they never got the same comment pass the actively-changing files have had.

## Low / nice-to-have

- No `helmet` (or equivalent) for baseline security headers on the Express app.
- `server.js`'s global error handler correctly avoids leaking `err.message`/stack traces to the client (good) — but it's worth double-checking every route's own catch blocks do the same; a few return `err.message` directly in the JSON response, which is fine for validation errors but should never be enabled for unexpected/database errors.
- Demo seed accounts (`db/seed.js`) use a shared, documented, publicly-known password (`Password123!`) — the code already comments "change or remove these before going live," which is the right call, just flagging it as a pre-launch checklist item since it's easy to forget.

## Suggested order of attack

1. Fix the SQL injection in `vehicles.js` (#1) — small, high-impact, no risk to other functionality.
2. Escape user input in email templates (#2) — small, contained.
3. Add rate limiting to auth + public enquiry routes (#3) — small, contained.
4. Everything else is either a refactor (#4–#6) or process/tooling (#7–#8) — worth scheduling once there isn't a queue of client-facing feature requests, since none of it is urgent the way #1–#3 are.

Happy to fix #1–#3 right now if you want — they're small, isolated changes.
