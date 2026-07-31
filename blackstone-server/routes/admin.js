import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'

const router = Router()

router.use(authCheck, requireRole('admin'))

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC',
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load users' })
  }
})

// PATCH /api/admin/users/:id/approve
router.patch('/users/:id/approve', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE users SET status = 'active' WHERE id = $1 RETURNING *`,
      [req.params.id],
    )
    if (!rows.length) return res.status(404).json({ message: 'User not found' })

    // TODO: send driver-approved email via emails/mailer.js

    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to approve user' })
  }
})

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body || {}
  try {
    const { rows } = await query('UPDATE users SET role = $1 WHERE id = $2 RETURNING *', [
      role,
      req.params.id,
    ])
    if (!rows.length) return res.status(404).json({ message: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update role' })
  }
})

export default router
