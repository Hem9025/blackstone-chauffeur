// Minimal HTML-escaping for values interpolated into the email templates in
// emails/templates/. Every one of those templates embeds free-text fields a
// customer, provider, or driver controls directly (passenger name, pickup/
// dropoff address, enquiry message, etc.) into a raw HTML string with plain
// template-literal interpolation. Without escaping, a booking placed with a
// "name" of e.g. `<a href="http://evil.example">Click to confirm</a>` would
// render as a real, clickable link inside the recipient's inbox — most email
// clients strip <script>, but they render arbitrary HTML/CSS just fine, so
// this is a genuine phishing/spoofing vector, not just a cosmetic one.
//
// This only escapes the five HTML-significant characters — it's not a
// general sanitizer, because nothing in these templates needs to let any
// actual HTML through from user-supplied data (only the hardcoded template
// markup itself should ever produce tags).
export function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
