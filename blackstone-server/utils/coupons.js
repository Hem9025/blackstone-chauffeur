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
 * Returns { ok: true, discountAmount, finalTotal, coupon } or
 * { ok: false, message }.
 */
export function evaluateCoupon(coupon, fare) {
  if (!coupon) return { ok: false, message: 'Invalid coupon code' }
  if (!coupon.active) return { ok: false, message: 'This coupon is no longer active' }
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

// Called only once a booking that used a coupon has actually been created
// (never at /validate time, which must stay side-effect-free) — increments
// the shared, cross-customer usage counter that max_uses checks against.
export async function incrementCouponUses(couponId) {
  if (!couponId) return
  await query('UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ?', [couponId])
}
