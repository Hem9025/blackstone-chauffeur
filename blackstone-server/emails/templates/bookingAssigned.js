import { layout } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Sent to a driver when they're assigned a ride. driverName is admin-managed
// (not something a customer controls), but pickup/dropoff are free-text
// addresses a customer or provider typed in — escape everything interpolated
// here rather than trying to reason case-by-case about which fields could
// ever contain someone else's input.
export function bookingAssignedTemplate({ driverName, pickup, dropoff, date, time }) {
  const safe = {
    driverName: escapeHtml(driverName),
    pickup: escapeHtml(pickup),
    dropoff: escapeHtml(dropoff),
    date: escapeHtml(date),
    time: escapeHtml(time),
  }

  return layout({
    preheader: 'A new ride has been assigned to you',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">New Ride Assigned</h2>
      <p>Hi ${safe.driverName},</p>
      <p>You've been assigned a new ride:</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${safe.pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${safe.dropoff}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${safe.date}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Time</td><td style="padding:6px 0;">${safe.time}</td></tr>
      </table>
      <p style="margin-top:16px;">Please log in to your driver dashboard to view full details.</p>
    `,
  })
}
