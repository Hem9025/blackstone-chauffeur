import { Router } from 'express'
import { query } from '../db/index.js'
import { sendMail } from '../emails/mailer.js'
import { enquiryAdminTemplate } from '../emails/templates/enquiryAdmin.js'
import { enquiryConfirmationTemplate } from '../emails/templates/enquiryConfirmation.js'
import { enquiryLimiter } from '../middleware/rateLimit.js'

const router = Router()

// POST /api/enquiries — public, no auth. Rate-limited (see
// middleware/rateLimit.js) — this is the easiest endpoint in the app for
// someone to script and spam, since it needs no account at all.
// `name` is optional — the homepage "Get in Touch" quick-contact widget
// (type: 'quick-contact') only collects an email address plus trip details
// folded into `message`, so this falls back to a placeholder name rather
// than forcing that widget to add a Name field just to satisfy this route.
router.post('/', enquiryLimiter, async (req, res) => {
  const { name, email, phone, message, type } = req.body || {}

  if (!email || !message) {
    return res.status(400).json({ message: 'email and message are required' })
  }
  const resolvedName = name && String(name).trim() ? String(name).trim() : 'Website Visitor'

  try {
    const inserted = await query(
      `INSERT INTO enquiries (name, email, phone, message, type) VALUES (?, ?, ?, ?, ?)`,
      [resolvedName, email, phone, message, type],
    )
    const { rows } = await query('SELECT * FROM enquiries WHERE id = ?', [inserted.insertId])

    if (process.env.ADMIN_EMAIL) {
      sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: `New enquiry from ${resolvedName}`,
        html: enquiryAdminTemplate({ name: resolvedName, email, phone, message, type }),
      }).catch((err) => console.error('Failed to send enquiry-admin email', err))
    }

    // Confirms receipt to whoever submitted it — matches the "we'll get back
    // to you within 24 hours" promise already shown on-screen after submitting.
    sendMail({
      to: email,
      subject: "We've received your enquiry — BlackStone Chauffeur",
      html: enquiryConfirmationTemplate({ name: resolvedName, message }),
    }).catch((err) => console.error('Failed to send enquiry-confirmation email', err))

    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to submit enquiry' })
  }
})

export default router
