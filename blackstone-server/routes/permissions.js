import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'

const router = Router()

const FLAGS = ['can_manage_bookings', 'can_manage_vehicles', 'can_manage_users', 'can_view_stats']

// GET /api/permissions — admin or second_admin. Lets second_admin's own
// dashboard know what to show/hide, and lets the main admin's Settings page
// show the current state of each toggle. 'admin' gets back the same shape
// but the client-side treats admin as always-allowed regardless of these
// values (see requirePermission.js server-side, useAdminPermissions.js
// client-side) — this response is what second_admin's UI actually keys off.
router.get('/', authCheck, requireRole('admin', 'second_admin'), async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM admin_permissions WHERE id = 1')
    const row = rows[0] || {}
    const permissions = Object.fromEntries(FLAGS.map((f) => [f, Boolean(row[f])]))
    res.json(permissions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load permissions' })
  }
})

// PATCH /api/permissions — admin only. Body: any subset of the flags above,
// each true/false. second_admin can never change these, including their own.
router.patch('/', authCheck, requireRole('admin'), async (req, res) => {
  const body = req.body || {}
  const sets = []
  const params = []
  for (const flag of FLAGS) {
    if (flag in body) {
      sets.push(`${flag} = ?`)
      params.push(Boolean(body[flag]))
    }
  }
  if (!sets.length) return res.status(400).json({ message: 'No recognised permission flags in the request body' })

  try {
    await query(`UPDATE admin_permissions SET ${sets.join(', ')} WHERE id = 1`, params)
    const { rows } = await query('SELECT * FROM admin_permissions WHERE id = 1')
    const row = rows[0] || {}
    const permissions = Object.fromEntries(FLAGS.map((f) => [f, Boolean(row[f])]))
    res.json(permissions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update permissions' })
  }
})

export default router
