# Email Templates

HTML templates (black/gold brand, inline styles), one file per template — all built:

- `layout.js` — shared shell (header/footer/button helper)
- `enquiryAdmin.js` — new enquiry notification to admin
- `bookingConfirmation.js` — booking confirmed → customer
- `bookingAssigned.js` — ride assigned → driver
- `driverPending.js` — application received → new driver
- `driverApproved.js` — account approved + login link → driver
- `rideReceipt.js` — ride complete summary → customer

Each exports a function that takes template data and returns an HTML string, used
with `sendMail()` in `../mailer.js`. Wired into the routes at each TODO from Phase 3.
