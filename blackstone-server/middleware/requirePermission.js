import { query } from '../db/index.js'

// Flags stored on the single-row admin_permissions table — see db/schema.sql.
const VALID_FLAGS = ['can_manage_bookings', 'can_manage_vehicles', 'can_manage_users', 'can_view_stats']

/**
 * Like requireRole('admin', 'second_admin'), but second_admin only passes
 * if the given flag is on — checking their own per-user override first
 * (Admin > Settings > individual overrides) and falling back to the shared
 * admin_permissions default if they don't have one. 'admin' always passes
 * regardless of the flags — they can never lock themselves out. Anyone else
 * (customer/driver/provider) is rejected the same as requireRole would
 * reject them, unless explicitly listed in `alsoAllow` — for the couple of
 * routes (e.g. POST /bookings/provider) that 'provider' also needs to
 * reach, unconditionally, alongside admin.
 */
export function requirePermission(flag, { alsoAllow = [] } = {}) {
  if (!VALID_FLAGS.includes(flag)) {
    throw new Error(`requirePermission: unknown flag "${flag}"`)
  }

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }
    if (req.user.role === 'admin' || alsoAllow.includes(req.user.role)) {
      return next()
    }
    if (req.user.role !== 'second_admin') {
      return res.status(403).json({ message: 'Forbidden: insufficient role' })
    }

    try {
      const { rows: overrideRows } = await query(`SELECT ${flag} FROM user_permissions WHERE user_id = ?`, [req.user.id])
      let allowed
      if (overrideRows.length) {
        allowed = Boolean(overrideRows[0][flag])
      } else {
        const { rows: defaultRows } = await query(`SELECT ${flag} FROM admin_permissions WHERE id = 1`)
        allowed = defaultRows.length ? Boolean(defaultRows[0][flag]) : false
      }
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden: this section has been restricted by the admin' })
      }
      next()
    } catch (err) {
      console.error('requirePermission lookup failed', err)
      res.status(500).json({ message: 'Failed to verify permissions' })
    }
  }
}
