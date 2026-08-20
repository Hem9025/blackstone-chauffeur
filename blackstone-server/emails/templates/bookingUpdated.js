import { layout } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Sent to the customer whenever an admin edits an existing booking (see
// PATCH /api/bookings/:id) — shows the booking's current details after the
// change, since we don't track a field-by-field diff of what exactly changed.
export function bookingUpdatedTemplate({ customerName, pickup, dropoff, date, time, totalPrice }) {
  // All free-text fields a customer/provider/admin typed at some point —
  // escaped before going into the HTML below (see emails/escapeHtml.js).
  const safe = {
    customerName: escapeHtml(customerName),
    pickup: escapeHtml(pickup),
    dropoff: escapeHtml(dropoff),
    date: escapeHtml(date),
    time: escapeHtml(time),
  }

  return layout({
    preheader: 'Your BlackStone Chauffeur booking has been updated',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Booking Updated</h2>
      <p>Hi ${safe.customerName},</p>
      <p>Your booking with BlackStone Chauffeur has been updated. Here are the current details:</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${safe.pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${safe.dropoff}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${safe.date}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Time</td><td style="padding:6px 0;">${safe.time}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Total</td><td style="padding:6px 0;">$${totalPrice}</td></tr>
      </table>
      <p style="margin-top:16px;">If anything above looks wrong, just reply to this email and we'll sort it out.</p>
    `,
  })
}
