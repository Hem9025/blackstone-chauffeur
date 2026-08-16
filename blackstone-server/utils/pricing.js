// Shared fare-calculation logic. Mirrors blackstone-client/src/utils/pricing.js —
// keep both in sync if the pricing model changes. The server copy is the
// authoritative one used to price bookings; the client copy is only for
// showing a live estimate before submission.

/**
 * Finds the flat fare for the distance bracket a trip falls into.
 * distance_tiers: [{ min, max, price }, ...] — max === null means open-ended
 * (matches or exceeds min, used for the last "222+" style bracket).
 */
export function tierPriceForDistance(distanceTiers, distanceKm) {
  if (!Array.isArray(distanceTiers) || !distanceTiers.length) return 0
  const km = Number(distanceKm) || 0

  const sorted = [...distanceTiers].sort((a, b) => a.min - b.min)
  for (const tier of sorted) {
    const min = Number(tier.min)
    const max = tier.max === null || tier.max === undefined ? Infinity : Number(tier.max)
    if (km >= min && km <= max) return Number(tier.price) || 0
  }
  // Distance beyond every defined bracket — fall back to the last tier's price.
  return Number(sorted[sorted.length - 1].price) || 0
}

// Extra Wait Time slider (5-60 min) — priced proportionally up to $20 at the
// 60-minute mark. Mirrors blackstone-client/src/pages/Booking.jsx's
// extraWaitPrice() exactly — this is the authoritative copy actually used to
// charge the customer; the client-side one is only for the live estimate.
const EXTRA_WAIT_MAX_MINUTES = 60
const EXTRA_WAIT_MAX_PRICE = 20

/**
 * Clamps a client-supplied minute count to the valid 0-60 range and returns
 * both the resolved minutes and the price for them — never trust a
 * client-supplied price for this add-on directly.
 */
export function resolveExtraWaitCharge(minutesInput) {
  const minutes = Math.min(EXTRA_WAIT_MAX_MINUTES, Math.max(0, Number(minutesInput) || 0))
  const price = minutes > 0 ? Math.round((minutes / EXTRA_WAIT_MAX_MINUTES) * EXTRA_WAIT_MAX_PRICE * 100) / 100 : 0
  return { minutes, price }
}

// Traffic Adjustment — mirrors blackstone-client/src/utils/pricing.js
// exactly (this server copy is the authoritative one actually charged).
// Google's estimated trip duration for the same distance can vary run to
// run (time of day, traffic), but flat distance-tier pricing doesn't
// reflect that at all, so two trips of the same km can quote identically
// even when one is genuinely going to take much longer. Rather than pricing
// every minute (which would make fares unpredictable), this only kicks in
// once actual duration runs meaningfully longer than a plain "normal
// traffic" expectation for that distance, and caps out at a modest amount.
const ASSUMED_AVG_KMH = 40 // Reasonable mixed urban/highway NZ average
const TRAFFIC_SURCHARGE_THRESHOLD = 1.25 // Only kicks in >25% over "normal"
const TRAFFIC_SURCHARGE_PER_MIN = 0.75
const TRAFFIC_SURCHARGE_MAX = 15

export function trafficSurcharge(distanceKm, durationMin) {
  const km = Number(distanceKm) || 0
  const min = Number(durationMin) || 0
  if (!km || !min) return 0
  const expectedMin = (km / ASSUMED_AVG_KMH) * 60
  const thresholdMin = expectedMin * TRAFFIC_SURCHARGE_THRESHOLD
  if (min <= thresholdMin) return 0
  const excessMin = min - thresholdMin
  return Math.min(TRAFFIC_SURCHARGE_MAX, Math.round(excessMin * TRAFFIC_SURCHARGE_PER_MIN * 100) / 100)
}

// Night Surcharge — pickups between midnight and 6am cost 15% more (drivers
// take a late-night loading, and it's a smaller pool willing to work those
// hours). Applied to the ride fare itself only — a child seat or an extra
// stop costs the same at 3am as it does at 3pm, so add-ons are deliberately
// excluded and layered on after. `time` is the plain "HH:MM" (or "HH:MM:SS")
// string the booking form/DB uses — 6:00am itself is treated as morning.
const NIGHT_SURCHARGE_START_HOUR = 0
const NIGHT_SURCHARGE_END_HOUR = 6
const NIGHT_SURCHARGE_RATE = 0.15

export function isNightBooking(time) {
  if (!time) return false
  const hour = Number(String(time).split(':')[0])
  if (!Number.isFinite(hour)) return false
  return hour >= NIGHT_SURCHARGE_START_HOUR && hour < NIGHT_SURCHARGE_END_HOUR
}

export function nightSurcharge(time, rideFare) {
  if (!isNightBooking(time)) return 0
  return Math.round((Number(rideFare) || 0) * NIGHT_SURCHARGE_RATE * 100) / 100
}

// The ride fare before add-ons and before the night surcharge — shared by
// calculateFare and by callers (e.g. the booking form's price breakdown)
// that need to show the night surcharge as its own line item priced off
// the same subtotal that's actually charged.
export function rideFareSubtotal({ vehicle, distanceKm, durationMin = 0, passengers, suitcases }) {
  if (!vehicle) return 0
  const hasDistance = distanceKm !== undefined && distanceKm !== null
  const base = hasDistance ? tierPriceForDistance(vehicle.distance_tiers, distanceKm) : 0
  const startingPrice = Number(vehicle.starting_price) || 0
  const perMinute = (Number(vehicle.price_per_minute) || 0) * (Number(durationMin) || 0)
  const perOccupant = (Number(vehicle.price_per_occupant) || 0) * (Number(passengers ?? vehicle.passengers) || 0)
  const perSuitcase = (Number(vehicle.price_per_suitcase) || 0) * (Number(suitcases ?? vehicle.suitcases) || 0)
  const surcharge = hasDistance ? trafficSurcharge(distanceKm, durationMin) : 0
  return base + startingPrice + perMinute + perOccupant + perSuitcase + surcharge
}

/**
 * Computes the full fare for a booking.
 * vehicle: row from the vehicles table (distance_tiers/features as JS values,
 * not JSON strings — the mysql2 driver already parses JSON columns).
 */
export function calculateFare({ vehicle, distanceKm, durationMin = 0, passengers, suitcases, addOnsTotal = 0, time }) {
  if (!vehicle) return 0

  const rideFare = rideFareSubtotal({ vehicle, distanceKm, durationMin, passengers, suitcases })
  const night = nightSurcharge(time, rideFare)

  const total = rideFare + night + (Number(addOnsTotal) || 0)
  return Math.round(total * 100) / 100
}
