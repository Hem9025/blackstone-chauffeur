import { layout } from './layout.js'

export function enquiryAdminTemplate({ name, email, phone, message, type }) {
  return layout({
    preheader: `New ${type || 'general'} enquiry from ${name}`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">New Enquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || '—'}</p>
      <p><strong>Type:</strong> ${type || 'general'}</p>
      <p style="margin-top:16px;padding:16px;background-color:#f8f7f4;">${message}</p>
    `,
  })
}
