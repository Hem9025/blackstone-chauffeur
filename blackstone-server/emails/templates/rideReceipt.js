import { layout } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Sent to the customer once a ride is marked completed.
export function rideReceiptTemplate({ customerName, pickup, dropoff, date, extras = [], totalPrice }) {
  const safe = {
    customerName: escapeHtml(customerName),
    pickup: escapeHtml(pickup),
    dropoff: escapeHtml(dropoff),
    date: escapeHtml(date),
  }

  // Add-on names are admin-managed (see db/schema.sql's add_ons table), not
  // something a customer can type freely — but escaping them costs nothing
  // and keeps this template safe even if that ever changes.
  const extrasList = extras.length
    ? extras.map((e) => `<li>${escapeHtml(e.name)} — $${e.price}</li>`).join('')
    : '<li>None</li>'

  return layout({
    preheader: 'Your BlackStone Chauffeur ride receipt',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Ride Complete — Receipt</h2>
      <p>Hi ${safe.customerName},</p>
      <p>Thanks for riding with BlackStone Chauffeur. Here's your receipt:</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${safe.pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${safe.dropoff}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${safe.date}</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b6b6b;">Add-ons:</p>
      <ul>${extrasList}</ul>
      <p style="margin-top:16px;font-weight:bold;">Total paid: $${totalPrice}</p>
    `,
  })
}
