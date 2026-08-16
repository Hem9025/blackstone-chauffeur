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
export function streamBookingsCsv(res, bookings, title) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replace(/\s+/g, '-')}.csv"`)

  const lines = [COLUMNS.map((c) => csvCell(c.label)).join(',')]

  bookings.forEach((b) => {
    lines.push(
      [
        b.date ? new Date(b.date).toLocaleDateString('en-NZ') : '',
        b.time ? String(b.time).slice(0, 5) : '',
        b.passenger_name || b.customer_name || '',
        b.pickup || '',
        b.dropoff || '',
        b.vehicle_name || '',
        b.booking_status || '',
        b.payment_status || '',
        Number(b.total_price || 0).toFixed(2),
      ]
        .map(csvCell)
        .join(','),
    )
  })

  // Leading BOM so Excel (which otherwise guesses the wrong encoding for
  // anything outside plain ASCII) opens this as UTF-8 correctly.
  res.send('﻿' + lines.join('\r\n'))
}
