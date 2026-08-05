import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'
import { sendMail } from '../emails/mailer.js'
import { driverApprovedTemplate } from '../emails/templates/driverApproved.js'

const router = Router()

router.use(authCheck, requireRole('admin'))

// Roles an admin can hand out through the "create account" form. Admin /
// second_admin accounts still have to go through the role-change endpoint
// below, so they're never a one-field slip on a creation form.
const CREATABLE_ROLES = ['customer', 'driver', 'provider']

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

// POST /api/admin/users — admin creates an account directly (no self-signup
// flow exists for providers, and this also lets admin fast-track a
// driver/customer account without waiting on approval).
router.post('/users', async (req, res) => {
  const { name, email, password, phone, role } = req.body || {}

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'name, email, password, and role are required' })
  }
  if (!CREATABLE_ROLES.includes(role)) {
    return res.status(400).json({ message: `role must be one of: ${CREATABLE_ROLES.join(', ')}` })
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    // Admin-created accounts are active immediately — no pending approval
    // step, since an admin is vouching for them directly.
    const inserted = await query(
      `INSERT INTO users (name, email, password_hash, phone, role, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [name, email, passwordHash, phone || null, role],
    )
    const { rows } = await query(
      'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?',
      [inserted.insertId],
    )

    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create user' })
  }
})

// PATCH /api/admin/users/:id/approve
router.patch('/users/:id/approve', async (req, res) => {
  try {
    await query(`UPDATE users SET status = 'active' WHERE id = ?`, [req.params.id])
    const { rows } = await query('SELECT * FROM users WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'User not found' })

    const approvedUser = rows[0]
    sendMail({
      to: approvedUser.email,
      subject: "You're approved — BlackStone Chauffeur",
      html: driverApprovedTemplate({
        name: approvedUser.name,
        loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
      }),
    }).catch((err) => console.error('Failed to send driver-approved email', err))

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
    await query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id])
    const { rows } = await query('SELECT * FROM users WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update role' })
  }
})

// GET /api/admin/vehicles — every vehicle including inactive ones, so admin
// can review/reactivate retired vehicles (the public /api/vehicles only
// returns active = true).
router.get('/vehicles', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM vehicles ORDER BY id')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load vehicles' })
  }
})

// Share of a completed booking's total_price that goes to the driver who
// fulfilled it — the rest is the admin's margin. No commission-rate
// concept exists anywhere else in the app yet, so this is a single
// adjustable constant rather than a per-driver/per-booking setting. Tune
// this (or move it to an env var / a per-driver DB column later) if the
// business's actual driver payout terms differ.
const DRIVER_COMMISSION_RATE = 0.75

// GET /api/admin/stats?role=driver|provider&user_id=123
// Per-user booking + revenue breakdown for drivers and providers, with an
// optional single-user filter (the "search for just one" case). Drivers
// are matched via bookings.driver_id (the ride they fulfil); providers are
// matched via bookings.customer_id (the booking they placed on a client's
// behalf) — see the driver_id/customer_id distinction used throughout
// routes/bookings.js.
router.get('/stats', async (req, res) => {
  const { role, user_id } = req.query || {}
  if (!['driver', 'provider'].includes(role)) {
    return res.status(400).json({ message: 'role must be "driver" or "provider"' })
  }

  const joinColumn = role === 'driver' ? 'driver_id' : 'customer_id'
  const params = [role]
  let userFilter = ''
  if (user_id) {
    userFilter = 'AND u.id = ?'
    params.push(user_id)
  }

  try {
    const { rows } = await query(
      `SELECT
         u.id, u.name, u.email, u.phone,
         COUNT(b.id) AS total_bookings,
         SUM(CASE WHEN b.booking_status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
         SUM(CASE WHEN b.booking_status IN ('pending','assigned','en_route','arrived') THEN 1 ELSE 0 END) AS upcoming_count,
         SUM(CASE WHEN b.booking_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
         COALESCE(SUM(CASE WHEN b.booking_status = 'completed' THEN b.total_price ELSE 0 END), 0) AS completed_revenue
       FROM users u
       LEFT JOIN bookings b ON b.${joinColumn} = u.id
       WHERE u.role = ? ${userFilter}
       GROUP BY u.id, u.name, u.email, u.phone
       ORDER BY u.name`,
      params,
    )

    const withPayout = rows.map((r) => {
      const completedRevenue = Number(r.completed_revenue) || 0
      const driverPayout = role === 'driver' ? Math.round(completedRevenue * DRIVER_COMMISSION_RATE * 100) / 100 : null
      const adminMargin = role === 'driver'
        ? Math.round((completedRevenue - driverPayout) * 100) / 100
        : completedRevenue
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        total_bookings: Number(r.total_bookings) || 0,
        completed_count: Number(r.completed_count) || 0,
        upcoming_count: Number(r.upcoming_count) || 0,
        cancelled_count: Number(r.cancelled_count) || 0,
        completed_revenue: completedRevenue,
        driver_payout: driverPayout,
        admin_margin: adminMargin,
      }
    })

    res.json({
      role,
      commission_rate: role === 'driver' ? DRIVER_COMMISSION_RATE : null,
      users: withPayout,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load stats' })
  }
})

// GET /api/admin/provider-payments/:providerId — every recorded monthly
// settlement for one provider, most recent first. A month with no row here
// simply hasn't been recorded yet — the client treats that as "unpaid".
router.get('/provider-payments/:providerId', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT month, status, updated_at FROM provider_payments WHERE provider_id = ? ORDER BY month DESC',
      [req.params.providerId],
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load payment history' })
  }
})

// PATCH /api/admin/provider-payments — upsert one month's settlement status
// for a provider. Admin decides when a payment actually lands, so this can
// mark any month (past, current, or future) paid or unpaid at any time —
// there's no automatic monthly rollover to keep in sync with.
router.patch('/provider-payments', async (req, res) => {
  const { provider_id, month, status } = req.body || {}
  if (!provider_id || !month || !['paid', 'unpaid'].includes(status)) {
    return res.status(400).json({ message: 'provider_id, month (YYYY-MM), and status (paid/unpaid) are required' })
  }
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'month must be in YYYY-MM format' })
  }

  try {
    await query(
      `INSERT INTO provider_payments (provider_id, month, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [provider_id, month, status],
    )
    const { rows } = await query(
      'SELECT month, status, updated_at FROM provider_payments WHERE provider_id = ? AND month = ?',
      [provider_id, month],
    )
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update payment status' })
  }
})

export default router
