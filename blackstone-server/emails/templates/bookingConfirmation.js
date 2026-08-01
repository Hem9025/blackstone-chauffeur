import { layout, button } from './layout.js'

export function bookingConfirmationTemplate({ customerName, pickup, dropoff, date, time, totalPrice }) {
  return layout({
    preheader: 'Your BlackStone Chauffeur booking is confirmed',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Booking Confirmed</h2>
      <p>Hi ${customerName},</p>
      <p>Your ride is booked. Here are the details:</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${dropoff}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${date}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Time</td><td style="padding:6px 0;">${time}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Total</td><td style="padding:6px 0;">$${totalPrice}</td></tr>
      </table>
      <p style="margin-top:16px;">We'll email you again once a chauffeur has been assigned.</p>
    `,
  })
}
