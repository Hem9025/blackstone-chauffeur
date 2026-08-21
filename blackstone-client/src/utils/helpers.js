export function formatCurrency(amount, currency = 'NZD') {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency }).format(amount)
}

// Booking date can be null on a provider/admin booking created before the
// date was confirmed (see routes/bookings.js POST /provider) — every caller
// across the app passes booking.date straight through without checking
// first, so `new Date(null)` silently formatting as "1 Jan 1970" would be an
// easy thing to miss. Guarded once here instead of at every call site.
export function formatDate(date) {
  if (!date) return 'TBC'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'TBC'
  return new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium' }).format(parsed)
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ')
}
