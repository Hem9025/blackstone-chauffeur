import { layout, button } from './layout.js'

export function passwordResetTemplate({ name, resetUrl }) {
  return layout({
    preheader: 'Reset your BlackStone Chauffeur password',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Reset Your Password</h2>
      <p>Hi ${name},</p>
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
