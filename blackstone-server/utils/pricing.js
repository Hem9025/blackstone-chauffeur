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

/**
 * Computes the full fare for a booking.
 * vehicle: row from the vehicles table (distance_tiers/features as JS values,
 * not JSON strings — the mysql2 driver already parses JSON columns).
 */
export function calculateFare({ vehicle, distanceKm, durationMin = 0, passengers, suitcases, addOnsTotal = 0 }) {
  if (!vehicle) return 0

  // Only price by distance bracket when a distance was actually given —
  // Hourly (trip_type) bookings have no dropoff/route, and without this
  // guard a missing distanceKm defaults to 0km, which matches the first
  // (cheapest but non-zero) tier and silently overcharges those bookings
  // for a "trip" that never happened.
  const base = distanceKm !== undefined && distanceKm !== null
    ? tierPriceForDistance(vehicle.distance_tiers, distanceKm)
    : 0
  const startingPrice = Number(vehicle.starting_price) || 0
  const perMinute = (Number(vehicle.price_per_minute) || 0) * (Number(durationMin) || 0)
  const perOccupant = (Number(vehicle.price_per_occupant) || 0) * (Number(passengers ?? vehicle.passengers) || 0)
  const perSuitcase = (Number(vehicle.price_per_suitcase) || 0) * (Number(suitcases ?? vehicle.suitcases) || 0)

  const total = base + startingPrice + perMinute + perOccupant + perSuitcase + (Number(addOnsTotal) || 0)
  return Math.round(total * 100) / 100
}
