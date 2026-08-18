import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'

const router = Router()

const FLAGS = ['can_manage_bookings', 'can_manage_vehicles', 'can_manage_users', 'can_view_stats']

async function getDefaultPermissions() {
  const { rows } = await query('SELECT * FROM admin_permissions WHERE id = 1')
  const row = rows[0] || {}
  return Object.fromEntries(FLAGS.map((f) => [f, Boolean(row[f])]))
}

// A second_admin with no row in user_permissions inherits the single
// admin_permissions default; one WITH a row uses their own flags instead —
// lets the main admin give individual second_admins different access
// without touching everyone else.
async function getEffectivePermissions(userId) {
  const { rows } = await query('SELECT * FROM user_permissions WHERE user_id = ?', [userId])
  if (rows.length) {
    return { permissions: Object.fromEntries(FLAGS.map((f) => [f, Boolean(rows[0][f])])), customized: true }
  }
  return { permissions: await getDefaultPermissions(), customized: false }
}

// GET /api/permissions — admin or second_admin. Lets second_admin's own
// dashboard know what to show/hide, and lets the main admin's Settings page
// show the current state of each toggle. 'admin' gets back a permissions
// shape too but the client-side treats admin as always-allowed regardless
// of these values (see requirePermission.js server-side,
// useAdminPermissions.js client-side) — this response is what
// second_admin's UI actually keys off.
router.get('/', authCheck, requireRole('admin', 'second_admin'), async (req, res) => {
  try {
    const { permissions } = await getEffectivePermissions(req.user.id)
    res.json(permissions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load permissions' })
  }
})

// PATCH /api/permissions — admin only. Edits the shared default that any
// second_admin without their own override (see /users below) inherits.
// Body: any subset of the flags above, each true/false.
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
    res.json(await getDefaultPermissions())
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update permissions' })
  }
})

// GET /api/permissions/users — admin only. Every second_admin account plus
// their effective permissions (their own override if they have one,
// otherwise the shared default) and whether that's a per-user override —
// powers the "individual overrides" list on Admin > Settings.
router.get('/users', authCheck, requireRole('admin'), async (req, res) => {
  try {
    const { rows: users } = await query(
      `SELECT id, name, email FROM users WHERE role = 'second_admin' ORDER BY name`,
    )
    const results = []
    for (const u of users) {
      const { permissions, customized } = await getEffectivePermissions(u.id)
      results.push({ id: u.id, name: u.name, email: u.email, permissions, customized })
    }
    res.json(results)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load second admin accounts' })
  }
})

// PATCH /api/permissions/users/:id — admin only. Gives this one second_admin
// their own permission set, seeded from whatever they currently effectively
// have (their existing override, or the shared default) so flipping a
// single flag never silently resets the other three.
router.patch('/users/:id', authCheck, requireRole('admin'), async (req, res) => {
  const body = req.body || {}
  const updates = {}
  for (const flag of FLAGS) {
    if (flag in body) updates[flag] = Boolean(body[flag])
  }
  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'No recognised permission flags in the request body' })
  }

  try {
    const { rows: userRows } = await query(`SELECT id FROM users WHERE id = ? AND role = 'second_admin'`, [req.params.id])
    if (!userRows.length) return res.status(404).json({ message: 'Second admin not found' })

    const { permissions: current } = await getEffectivePermissions(req.params.id)
    const merged = { ...current, ...updates }

    await query(
      `INSERT INTO user_permissions (user_id, can_manage_bookings, can_manage_vehicles, can_manage_users, can_view_stats)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         can_manage_bookings = VALUES(can_manage_bookings),
         can_manage_vehicles = VALUES(can_manage_vehicles),
         can_manage_users = VALUES(can_manage_users),
         can_view_stats = VALUES(can_view_stats)`,
      [req.params.id, merged.can_manage_bookings, merged.can_manage_vehicles, merged.can_manage_users, merged.can_view_stats],
    )
    res.json({ id: Number(req.params.id), permissions: merged, customized: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update this admin\'s permissions' })
  }
})

// DELETE /api/permissions/users/:id — admin only. Removes the override, so
// this second_admin goes back to inheriting the shared default.
router.delete('/users/:id', authCheck, requireRole('admin'), async (req, res) => {
  try {
    await query('DELETE FROM user_permissions WHERE user_id = ?', [req.params.id])
    const { permissions } = await getEffectivePermissions(req.params.id)
    res.json({ id: Number(req.params.id), permissions, customized: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to reset this admin\'s permissions' })
  }
})

export default router
