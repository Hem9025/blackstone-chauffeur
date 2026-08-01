import { formatCurrency, formatDate } from './helpers'

// PDF export is generated server-side (see utils/api.js downloadMyReport /
// downloadAllReport) using pdfkit — kept off the client to avoid pulling in
// a heavy browser-canvas PDF library just for a table export.

const COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'passenger', label: 'Passenger' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'dropoff', label: 'Drop-off' },
  { key: 'vehicle_name', label: 'Vehicle' },
  { key: 'booking_status', label: 'Status' },
  { key: 'payment_status', label: 'Payment' },
  { key: 'total_price', label: 'Total' },
]

function rowsFor(bookings) {
  return bookings.map((b) => ({
    ...b,
    passenger: b.passenger_name || b.customer_name || '—',
    total_price: formatCurrency(b.total_price || 0),
    date: b.date ? formatDate(b.date) : '',
  }))
}

function csvEscape(value) {
  const str = String(value ?? '')
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function bookingsToCSV(bookings, filename = 'bookings.csv') {
  const rows = rowsFor(bookings)
  const header = COLUMNS.map((c) => c.label).join(',')
  const lines = rows.map((r) => COLUMNS.map((c) => csvEscape(r[c.key])).join(','))
  const csv = [header, ...lines].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
