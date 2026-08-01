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

export function calculateFare({ vehicle, distanceKm, durationMin = 0, passengers, suitcases, addOnsTotal = 0 }) {
  if (!vehicle) return 0

  // Only price by distance bracket when a distance was actually given —
  // Hourly (trip_type) bookings have no dropoff/route.
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
