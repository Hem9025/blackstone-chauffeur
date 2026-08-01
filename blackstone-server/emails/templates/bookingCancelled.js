import { layout } from './layout.js'

// Shared by customer, admin, and driver notifications for a cancelled
// booking — only the greeting name and framing sentence change per recipient.
export function bookingCancelledTemplate({
  recipientName, greetingContext, vehicleName, pickup, dropoff, date, time,
}) {
  return layout({
    preheader: 'A BlackStone Chauffeur booking has been cancelled',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Booking Cancelled</h2>
      <p>Hi ${recipientName},</p>
      <p>${greetingContext}</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Vehicle</td><td style="padding:6px 0;">${vehicleName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${dropoff}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${date}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Time</td><td style="padding:6px 0;">${time}</td></tr>
      </table>
    `,
  })
}
