import { Router } from 'express'
import { query } from '../db/index.js'

const router = Router()

// POST /api/enquiries — public
router.post('/', async (req, res) => {
  const { name, email, phone, message, type } = req.body || {}

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'name, email, and message are required' })
  }

  try {
    const { rows } = await query(
      `INSERT INTO enquiries (name, email, phone, message, type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, phone, message, type],
    )

    // TODO: send enquiry-admin email via emails/mailer.js

    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to submit enquiry' })
  }
})

export default router
