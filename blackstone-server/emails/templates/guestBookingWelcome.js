import { layout, button } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Sent once, right after a guest-checkout booking is created (POST
// /api/bookings/guest) for a brand-new account — never for a guest whose
// email matched an existing account, since they already have a password.
// `resetUrl` reuses the exact same token mechanism as the normal
// forgot-password flow (see auth.js POST /forgot-password), just with a
// longer expiry set at creation time — this isn't a security-sensitive
// reset, it's a "claim the account we made for you" link.
export function guestBookingWelcomeTemplate({ name, pickup, dropoff, date, time, resetUrl }) {
  const safe = {
    name: escapeHtml(name),
    pickup: escapeHtml(pickup),
    dropoff: escapeHtml(dropoff),
    date: escapeHtml(date),
    time: escapeHtml(time),
  }

  return layout({
    preheader: "You're booked — set a password to manage your ride anytime",
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">You're Booked!</h2>
      <p>Hi ${safe.name},</p>
      <p>Thanks for booking with BlackStone Chauffeur. Here's a quick summary:</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${safe.pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${safe.dropoff}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${safe.date}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Time</td><td style="padding:6px 0;">${safe.time}</td></tr>
      </table>
      <p style="margin-top:20px;">
        We've also set up an account for you so you can track this ride, view your receipt, and
        book faster next time without retyping your details. Set a password whenever you like:
      </p>
      ${button('Set Your Password', resetUrl)}
      <p style="margin-top:28px;color:#666;font-size:13px;">
        Need to change something or have a question? Reach us directly:
      </p>
      <table role="presentation" style="margin-top:8px;">
        <tr>
          <td style="padding-right:10px;">
            <a href="tel:+64204525000" style="display:inline-block;background-color:#0a0a0a;color:#f8f7f4;text-decoration:none;padding:10px 18px;font-weight:bold;font-size:13px;border-radius:4px;">📞 Call Us</a>
          </td>
          <td>
            <a href="https://wa.me/64204525000" style="display:inline-block;background-color:#25D366;color:#ffffff;text-decoration:none;padding:10px 18px;font-weight:bold;font-size:13px;border-radius:4px;">💬 WhatsApp Us</a>
          </td>
        </tr>
      </table>
    `,
  })
}
