import { Router } from 'express'
import { query } from '../db/index.js'
import { sendMail } from '../emails/mailer.js'
import { enquiryAdminTemplate } from '../emails/templates/enquiryAdmin.js'

const router = Router()

// POST /api/enquiries — public
router.post('/', async (req, res) => {
  const { name, email, phone, message, type } = req.body || {}

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'name, email, and message are required' })
  }

  try {
    const inserted = await query(
      `INSERT INTO enquiries (name, email, phone, message, type) VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone, message, type],
    )
    const { rows } = await query('SELECT * FROM enquiries WHERE id = ?', [inserted.insertId])

    if (process.env.ADMIN_EMAIL) {
      sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: `New enquiry from ${name}`,
        html: enquiryAdminTemplate({ name, email, phone, message, type }),
      }).catch((err) => console.error('Failed to send enquiry-admin email', err))
    }

    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to submit enquiry' })
  }
})

export default router
