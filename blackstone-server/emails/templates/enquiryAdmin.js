import { layout } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Sent to ADMIN_EMAIL for every enquiry submitted via the public, unauthenticated
// POST /api/enquiries endpoint (Contact page, homepage "Get in Touch" widget,
// and the booking-form enquiry fallback). Every field here — including
// `message`, a free-form textarea — is fully attacker-controlled with no
// login required, which makes this the single highest-risk template in the
// folder for HTML injection: escaping is not optional here.
export function enquiryAdminTemplate({ name, email, phone, message, type }) {
  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    phone: escapeHtml(phone),
    type: escapeHtml(type),
    message: escapeHtml(message),
  }

  return layout({
    preheader: `New ${safe.type || 'general'} enquiry from ${safe.name}`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">New Enquiry</h2>
      <p><strong>Name:</strong> ${safe.name}</p>
      <p><strong>Email:</strong> ${safe.email}</p>
      <p><strong>Phone:</strong> ${safe.phone || '—'}</p>
      <p><strong>Type:</strong> ${safe.type || 'general'}</p>
      <p style="margin-top:16px;padding:16px;background-color:#f8f7f4;white-space:pre-wrap;">${safe.message}</p>
    `,
  })
}
