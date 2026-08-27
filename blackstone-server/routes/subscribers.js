import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requirePermission } from '../middleware/requirePermission.js'
import { streamSubscribersCsv } from '../utils/subscribersCsv.js'

const router = Router()

// Deliberately loose — just enough to reject an obviously malformed
// address, not a full RFC 5322 validator. The real bounce-checking happens
// wherever this list actually gets emailed from later.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/subscribers — public, no auth. Idempotent: submitting the same
// email again (e.g. someone double-clicking Subscribe) just updates name/
// source rather than erroring, so the footer form never needs to
// distinguish "new signup" from "already on the list" — both look like
// success to the visitor.
router.post('/', async (req, res) => {
  const { email, name, source } = req.body || {}
  const resolvedEmail = String(email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(resolvedEmail)) {
    return res.status(400).json({ message: 'Please enter a valid email address' })
  }

  try {
    await query(
      `INSERT INTO subscribers (email, name, source)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = COALESCE(VALUES(name), name),
         source = COALESCE(VALUES(source), source)`,
      [resolvedEmail, name ? String(name).trim().slice(0, 255) : null, source ? String(source).trim().slice(0, 50) : null],
    )
    res.status(201).json({ message: 'Subscribed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to subscribe' })
  }
})

// GET /api/subscribers — admin, or second_admin with can_manage_bookings
router.get('/', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM subscribers ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load subscribers' })
  }
})

// GET /api/subscribers/csv — same list, as a downloadable CSV — to hand
// off to whatever mailer BlackStone actually sends newsletters from, since
// no send-a-campaign feature lives in this app.
router.get('/csv', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM subscribers ORDER BY created_at DESC')
    streamSubscribersCsv(res, rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to export subscribers' })
  }
})

// DELETE /api/subscribers/:id — admin, or second_admin with
// can_manage_bookings. A real row deletion (unlike vehicles/coupons) —
// nothing else references a subscriber by id, so there's no history to
// preserve by soft-deleting instead.
router.delete('/:id', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    const { rows } = await query('SELECT id FROM subscribers WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Subscriber not found' })
    await query('DELETE FROM subscribers WHERE id = ?', [req.params.id])
    res.json({ message: 'Removed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to remove subscriber' })
  }
})

export default router
