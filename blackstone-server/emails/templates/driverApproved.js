import { layout, button } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Sent once an admin approves a pending driver application.
export function driverApprovedTemplate({ name, loginUrl }) {
  // `name` is whatever the applicant typed on the registration form —
  // escape it before it goes into the HTML below. `loginUrl` is always
  // built server-side (see routes/auth.js), never user input, so it's safe
  // to drop straight into the href as-is.
  const safeName = escapeHtml(name)

  return layout({
    preheader: 'Your driver account has been approved',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">You're Approved!</h2>
      <p>Hi ${safeName},</p>
      <p>
        Great news — your driver account has been approved. You can now log in and
        start accepting rides.
      </p>
      ${button('Log In', loginUrl)}
    `,
  })
}
