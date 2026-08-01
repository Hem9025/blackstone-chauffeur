// Shared booking rules — mirrors blackstone-client/src/utils/bookingRules.js.
// Rides must be booked at least MIN_ADVANCE_DAYS calendar days ahead, so
// dispatch has time to assign a driver and vehicle. The client enforces this
// in the date picker for UX, but it's re-checked here since the client value
// is never trusted.

export const MIN_ADVANCE_DAYS = 3

function toLocalISODate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Earliest calendar date (YYYY-MM-DD, server-local) a booking can be made for.
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
