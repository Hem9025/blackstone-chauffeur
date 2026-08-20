import { layout } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Sent immediately after someone submits a driver application (self-register
// with role: 'driver' — see routes/auth.js), before an admin has reviewed it.
export function driverPendingTemplate({ name }) {
  // `name` comes straight from the public registration form — escape before
  // it's embedded in this HTML email (see emails/escapeHtml.js).
  const safeName = escapeHtml(name)

  return layout({
    preheader: 'Your driver application has been received',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Application Received</h2>
      <p>Hi ${safeName},</p>
      <p>
        Thanks for applying to drive for BlackStone Chauffeur. Our team is reviewing
        your application and will be in touch shortly with next steps.
      </p>
    `,
  })
}
