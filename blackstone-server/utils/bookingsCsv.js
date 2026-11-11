const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'passenger', label: 'Passenger' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'dropoff', label: 'Dropoff' },
  { key: 'vehicle_name', label: 'Vehicle' },
  { key: 'booking_status', label: 'Status' },
  { key: 'payment_status', label: 'Payment' },
  { key: 'total_price', label: 'Total' },
]

// Excel/Sheets choke on unescaped commas, quotes, and newlines inside a
// field — wrap in quotes and double up any quote characters whenever a
// field contains one of those, exactly per the CSV spec (RFC 4180).
function csvCell(value) {
  const str = String(value ?? '').replace(/\r?\n/g, ' ')
  if (/[",]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Streams a CSV export of a booking list directly to an Express response —
 * the CSV counterpart to streamBookingsReport (PDF). Same row shape, so the
 * two "Download" buttons next to each other always describe the same data.
 */
export function streamBookingsCsv(res, bookings, title, { priceKey = 'total_price', priceLabel = 'Total', includePayment = true } = {}) {
  const columns = COLUMNS.filter((c) => includePayment || c.key !== 'payment_status').map((c) =>
    c.key === 'total_price' ? { ...c, label: priceLabel } : c,
  )
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replace(/\s+/g, '-')}.csv"`)

  const lines = [columns.map((c) => csvCell(c.label)).join(',')]

  bookings.forEach((b) => {
    const cells = {
      date: b.date ? new Date(b.date).toLocaleDateString('en-NZ') : '',
      time: b.time ? String(b.time).slice(0, 5) : '',
      passenger: b.passenger_name || b.customer_name || '',
      pickup: b.pickup || '',
      dropoff: b.dropoff || '',
      vehicle_name: b.vehicle_name || '',
      booking_status: b.booking_status || '',
      payment_status: b.payment_status || '',
      total_price: Number(b[priceKey] || 0).toFixed(2),
    }
    lines.push(columns.map((c) => csvCell(cells[c.key])).join(','))
  })

  // Leading BOM so Excel (which otherwise guesses the wrong encoding for
  // anything outside plain ASCII) opens this as UTF-8 correctly.
  res.send('﻿' + lines.join('\r\n'))
}
