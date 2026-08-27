import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'
import { requirePermission } from '../middleware/requirePermission.js'
import { findCouponByCode, evaluateCoupon } from '../utils/coupons.js'

const router = Router()

// Every column PATCH /:id is allowed to touch — see routes/vehicles.js for
// why this is whitelisted rather than built from Object.keys(req.body).
const EDITABLE_COUPON_COLUMNS = [
  'code', 'discount_type', 'discount_value', 'min_fare', 'max_discount', 'max_uses', 'expires_at', 'active',
]

// POST /api/coupons/validate — customer, live discount preview on the
// Booking page before submitting. Deliberately has no side effects (doesn't
// touch uses_count) so it's safe to call on every keystroke/blur, or never
// complete checkout at all — a use is only ever counted once a booking that
// actually applied the coupon is created (see routes/bookings.js).
router.post('/validate', authCheck, requireRole('customer'), async (req, res) => {
  const { code, fare } = req.body || {}
  try {
    const coupon = await findCouponByCode(code)
    const result = evaluateCoupon(coupon, fare, req.user.id)
    if (!result.ok) return res.status(400).json({ message: result.message })
    res.json({
      code: result.coupon.code,
      discount_type: result.coupon.discount_type,
      discount_value: result.coupon.discount_value,
      discount_amount: result.discountAmount,
      final_total: result.finalTotal,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to validate coupon' })
  }
})

// GET /api/coupons — admin, or second_admin with can_manage_bookings.
// Coupons directly affect what a customer is charged at checkout, the same
// area of the app can_manage_bookings already governs (assigning drivers,
// editing prices on existing bookings), so this reuses that flag rather
// than introducing a new one.
//
// Only ever returns kind='promo' — every customer's personal referral code
// and every reward code issued to a referrer also lives in this same table,
// but those are system-generated and would just be noise here (imagine one
// row per customer). See routes/referrals.js for the referral program's own
// (much narrower) view of the coupons table.
router.get('/', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM coupons WHERE kind = 'promo' ORDER BY created_at DESC`)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load coupons' })
  }
})

// POST /api/coupons — admin, or second_admin with can_manage_bookings
router.post('/', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  const { code, discount_type, discount_value, min_fare, max_discount, max_uses, expires_at, active } = req.body || {}

  const resolvedCode = String(code || '').trim().toUpperCase()
  if (!resolvedCode) return res.status(400).json({ message: 'Code is required' })
  if (!['percent', 'fixed'].includes(discount_type)) {
    return res.status(400).json({ message: 'discount_type must be "percent" or "fixed"' })
  }
  const value = Number(discount_value)
  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ message: 'discount_value must be a positive number' })
  }
  if (discount_type === 'percent' && value > 100) {
    return res.status(400).json({ message: 'A percent discount cannot exceed 100' })
  }

  try {
    const inserted = await query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_fare, max_discount, max_uses, expires_at, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resolvedCode,
        discount_type,
        value,
        Number(min_fare) || 0,
        max_discount === '' || max_discount == null ? null : Number(max_discount),
        max_uses === '' || max_uses == null ? null : Number(max_uses),
        expires_at || null,
        active !== false,
      ],
    )
    const { rows } = await query('SELECT * FROM coupons WHERE id = ?', [inserted.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'A coupon with this code already exists' })
    console.error(err)
    res.status(500).json({ message: 'Failed to create coupon' })
  }
})

// PATCH /api/coupons/:id — admin, or second_admin with can_manage_bookings
router.patch('/:id', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  const fields = req.body || {}
  const keys = Object.keys(fields).filter((k) => EDITABLE_COUPON_COLUMNS.includes(k))
  if (!keys.length) return res.status(400).json({ message: 'No recognised fields to update' })

  if ('discount_type' in fields && !['percent', 'fixed'].includes(fields.discount_type)) {
    return res.status(400).json({ message: 'discount_type must be "percent" or "fixed"' })
  }

  const setClause = keys.map((k) => `${k} = ?`).join(', ')
  const values = keys.map((k) => {
    if (k === 'code') return String(fields.code || '').trim().toUpperCase()
    if (['max_discount', 'max_uses'].includes(k)) {
      return fields[k] === '' || fields[k] == null ? null : Number(fields[k])
    }
    if (k === 'expires_at') return fields[k] || null
    return fields[k]
  })

  try {
    await query(`UPDATE coupons SET ${setClause} WHERE id = ?`, [...values, req.params.id])
    const { rows } = await query('SELECT * FROM coupons WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Coupon not found' })
    res.json(rows[0])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'A coupon with this code already exists' })
    console.error(err)
    res.status(500).json({ message: 'Failed to update coupon' })
  }
})

// DELETE /api/coupons/:id — admin, or second_admin with can_manage_bookings.
// Soft delete via active=false, same reasoning as vehicles: past bookings
// still reference this coupon by id (bookings.coupon_id), so a real row
// deletion would either fail on the FK or orphan that history.
router.delete('/:id', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    const { rows } = await query('SELECT id FROM coupons WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Coupon not found' })
    await query('UPDATE coupons SET active = false WHERE id = ?', [req.params.id])
    res.json({ message: 'Coupon deactivated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to deactivate coupon' })
  }
})

export default router
