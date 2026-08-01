import { layout, button } from './layout.js'

export function driverApprovedTemplate({ name, loginUrl }) {
  return layout({
    preheader: 'Your driver account has been approved',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">You're Approved!</h2>
      <p>Hi ${name},</p>
      <p>
        Great news — your driver account has been approved. You can now log in and
        start accepting rides.
      </p>
      ${button('Log In', loginUrl)}
    `,
  })
}
