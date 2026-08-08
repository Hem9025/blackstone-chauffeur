// Shared fare-calculation logic — mirrors blackstone-server/utils/pricing.js.
// This copy only powers the live "Price Estimate" shown before submission;
// the server always recalculates authoritatively when the booking is created.

export function tierPriceForDistance(distanceTiers, distanceKm) {
  if (!Array.isArray(distanceTiers) || !distanceTiers.length) return 0
  const km = Number(distanceKm) || 0

  const sorted = [...distanceTiers].sort((a, b) => a.min - b.min)
  for (const tier of sorted) {
    const min = Number(tier.min)
    const max = tier.max === null || tier.max === undefined ? Infinity : Number(tier.max)
    if (km >= min && km <= max) return Number(tier.price) || 0
  }
  return Number(sorted[sorted.length - 1].price) || 0
}

// Traffic Adjustment — Google's estimated trip duration for the same
// distance can vary run to run (time of day, traffic), but flat
// distance-tier pricing doesn't reflect that at all, so two trips of the
// same km can quote identically even when one is genuinely going to take
// much longer. Rather than pricing every minute (which would make fares
// unpredictable), this only kicks in once actual duration runs meaningfully
// longer than a plain "normal traffic" expectation for that distance, and
// caps out at a modest amount. Always shown to the customer as its own
// line item — never folded in silently.
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

export function calculateFare({ vehicle, distanceKm, durationMin = 0, passengers, suitcases, addOnsTotal = 0 }) {
  if (!vehicle) return 0

  // Only price by distance bracket when a distance was actually given —
  // Hourly (trip_type) bookings have no dropoff/route.
  const hasDistance = distanceKm !== undefined && distanceKm !== null
  const base = hasDistance ? tierPriceForDistance(vehicle.distance_tiers, distanceKm) : 0
  const startingPrice = Number(vehicle.starting_price) || 0
  const perMinute = (Number(vehicle.price_per_minute) || 0) * (Number(durationMin) || 0)
  const perOccupant = (Number(vehicle.price_per_occupant) || 0) * (Number(passengers ?? vehicle.passengers) || 0)
  const perSuitcase = (Number(vehicle.price_per_suitcase) || 0) * (Number(suitcases ?? vehicle.suitcases) || 0)
  const surcharge = hasDistance ? trafficSurcharge(distanceKm, durationMin) : 0

  const total = base + startingPrice + perMinute + perOccupant + perSuitcase + surcharge + (Number(addOnsTotal) || 0)
  return Math.round(total * 100) / 100
}
