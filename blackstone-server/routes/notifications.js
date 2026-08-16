import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'

const router = Router()

// GET /api/notifications — most recent 50 for whoever's logged in, plus a
// separate unread count (the bell badge needs the true total, not just how
// many of the 50 returned happen to be unread).
router.get('/', authCheck, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id],
    )
    const { rows: countRows } = await query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id],
    )
    res.json({ notifications: rows, unread_count: Number(countRows[0]?.count) || 0 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load notifications' })
  }
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authCheck, async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
    res.json({ message: 'Marked read' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update notification' })
  }
})

// PATCH /api/notifications/read-all
router.patch('/read-all', authCheck, async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [req.user.id])
    res.json({ message: 'Marked all read' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update notifications' })
  }
})

export default router
