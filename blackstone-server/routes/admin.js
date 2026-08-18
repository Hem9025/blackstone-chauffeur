import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requirePermission } from '../middleware/requirePermission.js'
import { sendMail } from '../emails/mailer.js'
import { driverApprovedTemplate } from '../emails/templates/driverApproved.js'

const router = Router()

// Every route here needs to be signed in — the specific admin-vs-
// second_admin-with-permission check is applied per route/section below
// (Users needs can_manage_users, Vehicles needs can_manage_vehicles, Stats
// & provider payments need can_view_stats). 'admin' always passes every
// requirePermission check regardless of the flags.
router.use(authCheck)

// Roles an admin can hand out through the "create account" form. Admin /
// second_admin accounts still have to go through the role-change endpoint
// below, so they're never a one-field slip on a creation form.
const CREATABLE_ROLES = ['customer', 'driver', 'provider']

// GET /api/admin/users
router.get('/users', requirePermission('can_manage_users'), async (req, res) => {
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
router.post('/users', requirePermission('can_manage_users'), async (req, res) => {
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
router.patch('/users/:id/approve', requirePermission('can_manage_users'), async (req, res) => {
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
router.patch('/users/:id/role', requirePermission('can_manage_users'), async (req, res) => {
  const { role } = req.body || {}
  // A second_admin granted can_manage_users could otherwise hand out (or
  // grant themselves) admin/second_admin — that tier of role change stays
  // exclusively an 'admin' action no matter what the permission flags say.
  if (req.user.role === 'second_admin' && ['admin', 'second_admin'].includes(role)) {
    return res.status(403).json({ message: 'Only admin can grant admin or second_admin access' })
  }
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
router.get('/vehicles', requirePermission('can_manage_vehicles'), async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM vehicles ORDER BY id')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load vehicles' })
  }
})

// GET /api/admin/overview — headline figures for the admin Dashboard page:
// lifetime totals, a booking-status breakdown, the last 12 months of
// booking volume/revenue (for the trend chart), and the top 5 vehicles by
// bookings. Revenue anywhere here only ever counts completed bookings —
// a pending/cancelled booking's total_price was never actually earned.
router.get('/overview', requirePermission('can_view_stats'), async (req, res) => {
  try {
    const { rows: totalsRows } = await query(
      `SELECT
         COUNT(*) AS total_bookings,
         SUM(CASE WHEN booking_status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
         SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
         SUM(CASE WHEN booking_status IN ('pending','assigned','en_route','arrived') THEN 1 ELSE 0 END) AS upcoming_count,
         COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN total_price ELSE 0 END), 0) AS total_revenue
       FROM bookings`,
    )
    const totals = totalsRows[0] || {}

    const { rows: statusRows } = await query(
      `SELECT booking_status, COUNT(*) AS count FROM bookings GROUP BY booking_status`,
    )
    const statusBreakdown = Object.fromEntries(statusRows.map((r) => [r.booking_status, Number(r.count)]))

    // Last 12 calendar months including the current one, keyed by when the
    // booking was actually made (created_at) — a clearer "how's business
    // trending" signal than the ride date, which can be booked well ahead.
    const { rows: monthlyRows } = await query(
      `SELECT
         DATE_FORMAT(created_at, '%Y-%m') AS month,
         COUNT(*) AS bookings,
         COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN total_price ELSE 0 END), 0) AS revenue
       FROM bookings
       WHERE created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 11 MONTH)
       GROUP BY month
       ORDER BY month`,
    )

    // Fills in any month with zero bookings so the chart always has a full,
    // evenly-spaced 12-month run rather than gaps where nothing happened.
    const monthlyByKey = Object.fromEntries(monthlyRows.map((r) => [r.month, r]))
    const monthlyTrend = []
    const cursor = new Date()
    cursor.setDate(1)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const row = monthlyByKey[key]
      monthlyTrend.push({
        month: key,
        bookings: row ? Number(row.bookings) : 0,
        revenue: row ? Number(row.revenue) : 0,
      })
    }

    const { rows: topVehicles } = await query(
      `SELECT v.name,
              COUNT(b.id) AS bookings,
              COALESCE(SUM(CASE WHEN b.booking_status = 'completed' THEN b.total_price ELSE 0 END), 0) AS revenue
       FROM bookings b
       JOIN vehicles v ON v.id = b.vehicle_id
       GROUP BY v.id, v.name
       ORDER BY bookings DESC
       LIMIT 5`,
    )

    // Today's bookings — keyed off the ride date, not created_at, since
    // "today's bookings" means rides happening today, not ones booked today.
    const { rows: todayRows } = await query(`SELECT COUNT(*) AS count FROM bookings WHERE date = CURDATE()`)

    // People/fleet counts — mirrors the same 'driver'+'active' filter used
    // everywhere else a driver list is built (e.g. GET /bookings/drivers),
    // so this number always matches what shows up in the assign-driver
    // dropdown rather than including drivers still pending approval.
    const { rows: peopleRows } = await query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE role = 'driver' AND status = 'active') AS total_drivers,
         (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total_customers,
         (SELECT COUNT(*) FROM vehicles WHERE active = TRUE) AS total_vehicles`,
    )
    const people = peopleRows[0] || {}

    // "Invoices" aren't a separate table in this system — every booking is
    // its own invoice (see the per-booking PDF invoice download), so paid
    // vs unpaid is read straight off payment_status. 'failed' and
    // 'refunded' both land in "unpaid" since neither represents revenue
    // actually collected right now.
    const { rows: invoiceRows } = await query(
      `SELECT
         COUNT(*) AS total_invoices,
         SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
         COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END), 0) AS paid_amount,
         SUM(CASE WHEN payment_status != 'paid' THEN 1 ELSE 0 END) AS unpaid_count,
         COALESCE(SUM(CASE WHEN payment_status != 'paid' THEN total_price ELSE 0 END), 0) AS unpaid_amount
       FROM bookings`,
    )
    const invoices = invoiceRows[0] || {}

    const completedCount = Number(totals.completed_count) || 0
    const totalRevenue = Number(totals.total_revenue) || 0
    // Current month's revenue is just the last entry of monthlyTrend (it's
    // already keyed by calendar month up to and including this one) —
    // cheaper than a second query for the same number.
    const revenueThisMonth = monthlyTrend[monthlyTrend.length - 1]?.revenue || 0

    res.json({
      total_bookings: Number(totals.total_bookings) || 0,
      completed_count: completedCount,
      cancelled_count: Number(totals.cancelled_count) || 0,
      upcoming_count: Number(totals.upcoming_count) || 0,
      today_bookings_count: Number(todayRows[0]?.count) || 0,
      total_revenue: totalRevenue,
      revenue_this_month: revenueThisMonth,
      avg_booking_value: completedCount ? Math.round((totalRevenue / completedCount) * 100) / 100 : 0,
      status_breakdown: statusBreakdown,
      monthly_trend: monthlyTrend,
      top_vehicles: topVehicles.map((v) => ({ name: v.name, bookings: Number(v.bookings), revenue: Number(v.revenue) })),
      total_drivers: Number(people.total_drivers) || 0,
      total_customers: Number(people.total_customers) || 0,
      total_vehicles: Number(people.total_vehicles) || 0,
      invoices: {
        total: Number(invoices.total_invoices) || 0,
        paid_count: Number(invoices.paid_count) || 0,
        paid_amount: Number(invoices.paid_amount) || 0,
        unpaid_count: Number(invoices.unpaid_count) || 0,
        unpaid_amount: Number(invoices.unpaid_amount) || 0,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load dashboard overview' })
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
router.get('/stats', requirePermission('can_view_stats'), async (req, res) => {
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
         u.id, u.name, u.email, u.phone, u.status, u.created_at,
         COUNT(b.id) AS total_bookings,
         SUM(CASE WHEN b.booking_status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
         SUM(CASE WHEN b.booking_status IN ('pending','assigned','en_route','arrived') THEN 1 ELSE 0 END) AS upcoming_count,
         SUM(CASE WHEN b.booking_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
         COALESCE(SUM(CASE WHEN b.booking_status = 'completed' THEN b.total_price ELSE 0 END), 0) AS completed_revenue
       FROM users u
       LEFT JOIN bookings b ON b.${joinColumn} = u.id
       WHERE u.role = ? ${userFilter}
       GROUP BY u.id, u.name, u.email, u.phone, u.status, u.created_at
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
        status: r.status,
        created_at: r.created_at,
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
router.get('/provider-payments/:providerId', requirePermission('can_view_stats'), async (req, res) => {
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
router.patch('/provider-payments', requirePermission('can_view_stats'), async (req, res) => {
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
