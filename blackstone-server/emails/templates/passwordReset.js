import { layout, button } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Sent by POST /api/auth/forgot-password. `resetUrl` is always built
// server-side from a random token (crypto.randomBytes), never user input, so
// it's safe to put straight into the button's href. `name` is the account
// holder's stored name, which — like any other name field in this app — was
// originally typed in by a user, so it's escaped the same as everywhere else.
export function passwordResetTemplate({ name, resetUrl }) {
  const safeName = escapeHtml(name)

  return layout({
    preheader: 'Reset your BlackStone Chauffeur password',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Reset Your Password</h2>
      <p>Hi ${safeName},</p>
      <p>
        We received a request to reset the password on your BlackStone Chauffeur account.
        Click the button below to choose a new one — this link expires in 1 hour.
      </p>
      ${button('Reset Password', resetUrl)}
      <p style="margin-top:24px;color:#666;font-size:13px;">
        If you didn't request this, you can safely ignore this email — your password won't be changed.
      </p>
    `,
  })
}
