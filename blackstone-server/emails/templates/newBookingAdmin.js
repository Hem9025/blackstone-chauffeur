import { layout } from './layout.js'

// Sent to ADMIN_EMAIL whenever a booking is placed — either a customer's
// payment succeeds (see POST /bookings/confirm) or a provider places one on
// behalf of a client (see POST /bookings/provider, which has no payment step).
export function newBookingAdminTemplate({
  customerName, vehicleName, serviceType, pickup, dropoff, date, time, hours, totalPrice,
}) {
  return layout({
    preheader: `New booking from ${customerName}`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">New Booking Received</h2>
      <p>A new booking has just come in:</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Customer</td><td style="padding:6px 0;">${customerName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Service</td><td style="padding:6px 0;">${serviceType}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Vehicle</td><td style="padding:6px 0;">${vehicleName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${dropoff}</td></tr>
        ${hours ? `<tr><td style="padding:6px 0;color:#6b6b6b;">Duration</td><td style="padding:6px 0;">${hours} hours</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${date}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Time</td><td style="padding:6px 0;">${time}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Total</td><td style="padding:6px 0;">$${totalPrice}</td></tr>
      </table>
      <p style="margin-top:16px;">Assign a driver from the admin dashboard when ready.</p>
    `,
  })
}
