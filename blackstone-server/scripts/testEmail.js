// One-off sanity check for the Brevo SMTP setup — sends a single test email
// using the exact same transporter the app uses for real notifications, so
// a success here means booking/cancellation emails will actually go out.
//
// Usage:
//   npm run test:email your.name@example.com
//   (or with no argument, it sends to ADMIN_EMAIL from .env)

import 'dotenv/config'
import { sendMail } from '../emails/mailer.js'

const to = process.argv[2] || process.env.ADMIN_EMAIL

if (!to) {
  console.error('No recipient given and ADMIN_EMAIL is not set in .env.')
  console.error('Usage: npm run test:email your.name@example.com')
  process.exit(1)
}

const missing = ['BREVO_SMTP_HOST', 'BREVO_SMTP_USER', 'BREVO_SMTP_PASS'].filter(
  (key) => !process.env[key] || process.env[key].includes('replace-with'),
)
if (missing.length) {
  console.error(`These are still unset or placeholder values in .env: ${missing.join(', ')}`)
  process.exit(1)
}

console.log(`Sending a test email to ${to} via ${process.env.BREVO_SMTP_HOST}...`)

try {
  await sendMail({
    to,
    subject: 'BlackStone Chauffeur — SMTP test',
    html: '<p>If you\'re reading this, your Brevo SMTP credentials are working correctly.</p>',
  })
  console.log('Sent successfully. Check the inbox (and spam folder) for', to)
} catch (err) {
  console.error('Failed to send:', err.message)
  if (err.responseCode === 535 || /invalid login|authentication/i.test(err.message)) {
    console.error('This usually means BREVO_SMTP_USER or BREVO_SMTP_PASS is wrong.')
    console.error('BREVO_SMTP_USER should be your Brevo account login email — not the SMTP key.')
    console.error('BREVO_SMTP_PASS should be the SMTP key from Brevo > SMTP & API > SMTP tab.')
  }
  process.exit(1)
}
