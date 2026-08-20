import rateLimit from 'express-rate-limit'

// Nothing in this app rate-limited any endpoint before this — meaning
// /api/auth/login could be brute-forced against a known email with no
// lockout at all, and the public, unauthenticated /api/enquiries endpoint
// could be scripted to spam the admin's inbox indefinitely. These three
// limiters are deliberately narrow (only the routes that actually need
// them), rather than one global limiter on the whole app, so normal
// dashboard/booking traffic is never affected.

// Login: generous enough that a real person mistyping their password a few
// times never gets blocked, tight enough that scripted password-guessing
// against one account gets meaningfully slowed down.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait a few minutes and try again.' },
})

// Forgot-password: this route always returns the same generic message
// whether or not the email exists (see routes/auth.js), so it can't be used
// to enumerate accounts — but without a limiter it could still be used to
// flood a real user's inbox with reset emails, or hammer the mail provider.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reset requests. Please wait a few minutes and try again.' },
})

// Public enquiry form (Contact page, homepage widget, booking-form enquiry
// fallback) — no login required, so this is the easiest endpoint in the app
// for someone to script and spam. A genuine visitor never sends more than a
// couple of enquiries in an hour; this only kicks in well past that.
export const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many enquiries submitted from this connection. Please try again later.' },
})
