import { layout } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Sent to ADMIN_EMAIL whenever a booking is placed — either a customer's
// payment succeeds (see POST /bookings/confirm) or a provider places one on
// behalf of a client (see POST /bookings/provider, which has no payment step).
export function newBookingAdminTemplate({
  customerName, vehicleName, serviceType, pickup, dropoff, date, time, hours, totalPrice,
}) {
  // customerName/pickup/dropoff are free text the customer or provider typed
  // in — escape every one of them before they go into the HTML string below.
  // vehicleName/serviceType/date/time are lower-risk (admin-managed or
  // constrained to known values elsewhere), but escaping them too costs
  // nothing and means this template never has to be revisited if that
  // constraint changes.
  const safe = {
    customerName: escapeHtml(customerName),
    vehicleName: escapeHtml(vehicleName),
    serviceType: escapeHtml(serviceType),
    pickup: escapeHtml(pickup),
    dropoff: escapeHtml(dropoff),
    date: escapeHtml(date),
    time: escapeHtml(time),
  }

  return layout({
    preheader: `New booking from ${safe.customerName}`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">New Booking Received</h2>
      <p>A new booking has just come in:</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Customer</td><td style="padding:6px 0;">${safe.customerName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Service</td><td style="padding:6px 0;">${safe.serviceType}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Vehicle</td><td style="padding:6px 0;">${safe.vehicleName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${safe.pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${safe.dropoff}</td></tr>
        ${hours ? `<tr><td style="padding:6px 0;color:#6b6b6b;">Duration</td><td style="padding:6px 0;">${escapeHtml(hours)} hours</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${safe.date}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Time</td><td style="padding:6px 0;">${safe.time}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Total</td><td style="padding:6px 0;">$${totalPrice}</td></tr>
      </table>
      <p style="margin-top:16px;">Assign a driver from the admin dashboard when ready.</p>
    `,
  })
}
