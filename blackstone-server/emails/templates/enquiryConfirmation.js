import { layout } from './layout.js'

// Sent to whoever submitted an enquiry (Contact page or the homepage "Get in
// Touch" widget), confirming it was received — mirrors what the on-screen
// success message already promises them.
export function enquiryConfirmationTemplate({ name, message }) {
  return layout({
    preheader: "We've received your enquiry — BlackStone Chauffeur",
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Thanks for Getting in Touch</h2>
      <p>Hi ${name},</p>
      <p>We've received your message and will get back to you within 24 hours.</p>
      <p style="margin-top:16px;color:#6b6b6b;">A copy of what you sent us:</p>
      <p style="margin-top:8px;padding:16px;background-color:#f8f7f4;white-space:pre-wrap;">${message}</p>
    `,
  })
}
