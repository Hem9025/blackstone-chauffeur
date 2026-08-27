import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'
import { getOrCreateReferralCode, REFERRER_REWARD_AMOUNT } from '../utils/coupons.js'

const router = Router()

// GET /api/referrals/me — customer, their own personal referral code
// (created lazily on first request — see getOrCreateReferralCode). Reused
// directly as a normal coupon everywhere else in the app (the Booking
// page's existing "Coupon code" field, POST /api/bookings) — there's no
// separate referral-redemption endpoint or UI, only this one to fetch and
// display your own code.
router.get('/me', authCheck, requireRole('customer'), async (req, res) => {
  try {
    // The JWT payload only carries id/role/email (see routes/auth.js), not
    // name — looked up fresh here since it's only needed once, the first
    // time this customer's referral code is ever generated.
    const { rows } = await query('SELECT name FROM users WHERE id = ?', [req.user.id])
    const coupon = await getOrCreateReferralCode(req.user.id, rows[0]?.name)
    res.json({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_discount: coupon.max_discount,
      reward_amount: REFERRER_REWARD_AMOUNT,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load your referral code' })
  }
})

export default router
