// Shared coupon lookup + validation logic, used by both the live-preview
// endpoint (POST /api/coupons/validate) and actual booking creation
// (POST /api/bookings) — one place decides whether a coupon applies and how
// much it's worth, so a customer can never see one discount at preview time
// and get charged a different one at checkout.
import { query } from '../db/index.js'

// Codes are stored and matched case-insensitively (normalized to uppercase
// on both write and lookup) so "welcome10", "Welcome10", and "WELCOME10"
// all resolve to the same coupon.
export async function findCouponByCode(codeRaw) {
  const code = String(codeRaw || '').trim().toUpperCase()
  if (!code) return null
  const { rows } = await query('SELECT * FROM coupons WHERE code = ?', [code])
  return rows[0] || null
}

/**
 * Checks a coupon against a given fare (before discount) and, if valid,
 * computes the discount. Never trusts a client-supplied discount amount —
 * this is the only place that number is ever produced, from the coupon's
 * own stored rules against a fare that was itself already computed
 * server-side (see calculateFare in utils/pricing.js).
 *
 * userId is the customer attempting to redeem it — required to enforce the
 * two ownership rules on personal (non-'promo') coupons: a 'referral' code
 * can be used by anyone EXCEPT the customer it belongs to (no
 * self-referral), and a 'reward' code can only be used by the customer it
 * was issued to.
 *
 * Returns { ok: true, discountAmount, finalTotal, coupon } or
 * { ok: false, message }.
 */
export function evaluateCoupon(coupon, fare, userId) {
  if (!coupon) return { ok: false, message: 'Invalid coupon code' }
  if (!coupon.active) return { ok: false, message: 'This coupon is no longer active' }
  if (coupon.kind === 'referral' && coupon.owner_user_id === userId) {
    return { ok: false, message: "You can't use your own referral code" }
  }
  if (coupon.kind === 'reward' && coupon.owner_user_id !== userId) {
    return { ok: false, message: 'This coupon is not valid for your account' }
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { ok: false, message: 'This coupon has expired' }
  }
  if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses) {
    return { ok: false, message: 'This coupon has reached its usage limit' }
  }

  const fareNum = Number(fare) || 0
  const minFare = Number(coupon.min_fare) || 0
  if (fareNum < minFare) {
    return { ok: false, message: `This coupon requires a minimum fare of $${minFare.toFixed(2)}` }
  }

  let discountAmount = coupon.discount_type === 'percent'
    ? fareNum * (Number(coupon.discount_value) / 100)
    : Number(coupon.discount_value)

  if (coupon.max_discount != null) {
    discountAmount = Math.min(discountAmount, Number(coupon.max_discount))
  }
  // Never let a coupon zero out (or exceed) the fare — floors the amount
  // actually charged at $1 so Stripe always receives a valid, sane amount.
  discountAmount = Math.max(0, Math.min(discountAmount, fareNum - 1))
  discountAmount = Math.round(discountAmount * 100) / 100

  return {
    ok: true,
    discountAmount,
    finalTotal: Math.round((fareNum - discountAmount) * 100) / 100,
    coupon,
  }
}

// Referral program constants. Not exposed through an admin settings screen
// (unlike the promo banner) — deliberately kept as plain constants here to
// stay in scope; ask if these figures should change and edit them directly.
const REFERRAL_DISCOUNT_PERCENT = 10 // what the new customer (referee) saves on their first booking
const REFERRAL_MAX_DISCOUNT = 30 // dollar cap on that 10%, so a huge fare doesn't create a huge discount
export const REFERRER_REWARD_AMOUNT = 15 // fixed-dollar thank-you coupon issued to the referrer — exported so routes/referrals.js can show it without duplicating the number

// Keeps referral/reward codes readable (a customer might read one aloud or
// type it from a screenshot) — letters and digits only, no lookalike-heavy
// symbols.
function randomCodeSuffix(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O or 1/I
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function slugFromName(name) {
  const slug = String(name || '').replace(/[^a-zA-Z]/g, '').slice(0, 8).toUpperCase()
  return slug || 'FRIEND'
}

/**
 * Returns this customer's personal referral coupon, creating it the first
 * time they're asked for one (see routes/referrals.js GET /me). Idempotent —
 * a second call just returns the same row, never a duplicate.
 */
export async function getOrCreateReferralCode(userId, userName) {
  const { rows: existing } = await query(
    `SELECT * FROM coupons WHERE owner_user_id = ? AND kind = 'referral' LIMIT 1`,
    [userId],
  )
  if (existing.length) return existing[0]

  const base = slugFromName(userName)
  // Collision retry rather than a single attempt — the code column is
  // UNIQUE, and a short random suffix has a real (if small) chance of
  // clashing with an existing code, especially once many customers share
  // the same short first name.
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = `${base}${randomCodeSuffix(4)}`
    try {
      const inserted = await query(
        `INSERT INTO coupons (code, discount_type, discount_value, max_discount, active, kind, owner_user_id)
         VALUES (?, 'percent', ?, ?, TRUE, 'referral', ?)`,
        [code, REFERRAL_DISCOUNT_PERCENT, REFERRAL_MAX_DISCOUNT, userId],
      )
      const { rows } = await query('SELECT * FROM coupons WHERE id = ?', [inserted.insertId])
      return rows[0]
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') throw err
      // Code collision — loop again with a fresh random suffix.
    }
  }
  throw new Error('Failed to generate a unique referral code')
}

/**
 * Issues a one-time-use 'reward' coupon to a referrer — called from
 * routes/bookings.js once someone they referred completes their first
 * booking (see the isFirstBooking check there). Never fails silently: a
 * thrown error here is caught by the booking route and just logged, so a
 * hiccup issuing the reward never blocks the booking itself from going through.
 */
export async function issueReferralReward(referrerUserId) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = `THANKS${randomCodeSuffix(6)}`
    try {
      await query(
        `INSERT INTO coupons (code, discount_type, discount_value, max_uses, active, kind, owner_user_id)
         VALUES (?, 'fixed', ?, 1, TRUE, 'reward', ?)`,
        [code, REFERRER_REWARD_AMOUNT, referrerUserId],
      )
      return { code, amount: REFERRER_REWARD_AMOUNT }
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') throw err
    }
  }
  throw new Error('Failed to issue referral reward')
}

// Called only once a booking that used a coupon has actually been created
// (never at /validate time, which must stay side-effect-free) — increments
// the shared, cross-customer usage counter that max_uses checks against.
export async function incrementCouponUses(couponId) {
  if (!couponId) return
  await query('UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ?', [couponId])
}
