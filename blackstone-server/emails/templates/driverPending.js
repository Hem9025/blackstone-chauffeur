import { layout } from './layout.js'

export function driverPendingTemplate({ name }) {
  return layout({
    preheader: 'Your driver application has been received',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Application Received</h2>
      <p>Hi ${name},</p>
      <p>
        Thanks for applying to drive for BlackStone Chauffeur. Our team is reviewing
        your application and will be in touch shortly with next steps.
      </p>
    `,
  })
}
