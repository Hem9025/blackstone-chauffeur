import { layout } from './layout.js'

export function bookingAssignedTemplate({ driverName, pickup, dropoff, date, time }) {
  return layout({
    preheader: 'A new ride has been assigned to you',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">New Ride Assigned</h2>
      <p>Hi ${driverName},</p>
      <p>You've been assigned a new ride:</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${dropoff}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${date}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Time</td><td style="padding:6px 0;">${time}</td></tr>
      </table>
      <p style="margin-top:16px;">Please log in to your driver dashboard to view full details.</p>
    `,
  })
}
