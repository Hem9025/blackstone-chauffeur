// Shared booking rules — mirrors blackstone-server/utils/bookingRules.js.
// Rides must be booked at least MIN_ADVANCE_DAYS calendar days ahead, so
// dispatch has time to assign a driver and vehicle. This only drives the UI
// (date picker min + inline validation) — the server re-checks independently
// since it never trusts client input.

export const MIN_ADVANCE_DAYS = 3

function toLocalISODate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Earliest calendar date (YYYY-MM-DD, browser-local) a booking can be made for.
export function minBookingDate() {
  const d = new Date()
  d.setDate(d.getDate() + MIN_ADVANCE_DAYS)
  return toLocalISODate(d)
}

// dateStr: 'YYYY-MM-DD'. Plain string comparison works because the format is
// fixed-width and zero-padded, so lexical order matches chronological order.
export function isDateFarEnoughAhead(dateStr) {
  return typeof dateStr === 'string' && dateStr.length === 10 && dateStr >= minBookingDate()
}

// Instant online booking is limited to a standard service radius around
// Auckland — pickups further out route to an enquiry instead (see Booking.jsx),
// since dispatching a chauffeur that far isn't a same-day, fixed-price affair.
// This is a client-side UX gate only; it isn't re-enforced server-side yet,
// so a determined user could still submit a booking outside the radius by
// calling the API directly — same category of trust as any other
// client-computed value that hasn't been mirrored server-side.
export const SERVICE_RADIUS_KM = 200

// Central Auckland (Sky Tower area) — the reference point trips are
// measured from.
const AUCKLAND_LAT = -36.8509
const AUCKLAND_LNG = 174.7645

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Straight-line distance in km from central Auckland to a given point, or
// null if coordinates aren't available yet (e.g. before a place is selected).
export function distanceFromAucklandKm(lat, lng) {
  if (lat == null || lng == null) return null
  return haversineKm(AUCKLAND_LAT, AUCKLAND_LNG, Number(lat), Number(lng))
}

// True when a point is within the standard service radius, or when there's
// no coordinate yet to check (so the UI doesn't block on an address the
// user hasn't finished selecting from the autocomplete).
export function isWithinServiceRadius(lat, lng) {
  const d = distanceFromAucklandKm(lat, lng)
  return d === null || d <= SERVICE_RADIUS_KM
}
