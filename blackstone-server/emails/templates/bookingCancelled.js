import { layout } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Shared by customer, admin, and driver notifications for a cancelled
// booking — only the greeting name and framing sentence change per recipient.
// greetingContext is always one of a few hardcoded sentences chosen by the
// server (see routes/bookings.js), never user-supplied — but everything else
// here (name, pickup/dropoff, vehicle name) can trace back to something a
// customer or provider typed in, so it's escaped the same as every other
// template in this folder.
export function bookingCancelledTemplate({
  recipientName, greetingContext, vehicleName, pickup, dropoff, date, time,
}) {
  const safe = {
    recipientName: escapeHtml(recipientName),
    vehicleName: escapeHtml(vehicleName),
    pickup: escapeHtml(pickup),
    dropoff: escapeHtml(dropoff),
    date: escapeHtml(date),
    time: escapeHtml(time),
  }

  return layout({
    preheader: 'A BlackStone Chauffeur booking has been cancelled',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Booking Cancelled</h2>
      <p>Hi ${safe.recipientName},</p>
      <p>${greetingContext}</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Vehicle</td><td style="padding:6px 0;">${safe.vehicleName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${safe.pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${safe.dropoff}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${safe.date}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Time</td><td style="padding:6px 0;">${safe.time}</td></tr>
      </table>
    `,
  })
}
