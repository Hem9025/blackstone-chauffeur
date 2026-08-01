import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const GOLD = '#c9a227'
const BLACK = '#0a0a0a'
const GREY = '#6b6b6b'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.png')

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`
}

/**
 * Streams a one-page invoice PDF for a booking directly to an Express
 * response. `booking` must include the joined vehicle_name, customer_name,
 * customer_email (see the query in the /invoice route).
 */
export function streamInvoice(res, booking) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  // BSC = BlackStone Chauffeur. Booking IDs are already sequential and
  // unique, so they double as the invoice sequence — no separate counter
  // to maintain.
  const invoiceNumber = `BSC-${String(booking.id).padStart(6, '0')}`

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${invoiceNumber}.pdf"`)
  doc.pipe(res)

  // Header — logo on the left, "BlackStone Chauffeur" wordmark stays as a
  // fallback if the asset is ever missing so the PDF never breaks.
  const headerTop = doc.y
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 50, headerTop, { width: 60 })
    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(16).text('BlackStone Chauffeur', 120, headerTop + 6)
    doc.fillColor(GOLD).font('Helvetica').fontSize(10).text('Premium Chauffeur Services — New Zealand', 120, headerTop + 26)
    doc.y = headerTop + 65
  } else {
    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(20).text('BlackStone Chauffeur')
    doc.fillColor(GOLD).font('Helvetica').fontSize(10).text('Premium Chauffeur Services — New Zealand')
    doc.moveDown(1.5)
  }

  doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(16).text('INVOICE', { align: 'right' })
  doc.fillColor(GREY).font('Helvetica').fontSize(10)
  doc.text(`Invoice #: ${invoiceNumber}`, { align: 'right' })
  doc.text(`Issued: ${new Date().toLocaleDateString('en-NZ')}`, { align: 'right' })
  doc.text(`Booking ref: #${booking.id}`, { align: 'right' })

  doc.moveDown(1)
  doc.strokeColor(GOLD).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(1)

  // Bill to
  const passenger = booking.passenger_name || booking.customer_name || 'Guest'
  doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(11).text('Passenger')
  doc.font('Helvetica').fontSize(10).fillColor(GREY)
  doc.text(passenger)
  if (booking.passenger_phone) doc.text(booking.passenger_phone)

  if (booking.passenger_name && booking.customer_name) {
    doc.moveDown(0.5)
    doc.font('Helvetica-Bold').fillColor(BLACK).fontSize(11).text('Booked By')
    doc.font('Helvetica').fillColor(GREY).fontSize(10)
    doc.text(booking.customer_name)
    if (booking.customer_email) doc.text(booking.customer_email)
  }

  doc.moveDown(1.5)

  // Trip details
  doc.font('Helvetica-Bold').fillColor(BLACK).fontSize(11).text('Trip Details')
  doc.moveDown(0.3)
  const tripRows = [
    ['Pickup', booking.pickup],
    ['Drop-off', booking.dropoff],
    ['Date', new Date(booking.date).toLocaleDateString('en-NZ')],
    ['Time', String(booking.time).slice(0, 5)],
    ['Vehicle', booking.vehicle_name || '—'],
  ]
  if (booking.distance_km) tripRows.push(['Distance', `${booking.distance_km} km`])
  if (booking.duration_min) tripRows.push(['Duration', `${booking.duration_min} min`])

  doc.font('Helvetica').fontSize(10)
  tripRows.forEach(([label, value]) => {
    const y = doc.y
    doc.fillColor(GREY).text(label, 50, y, { width: 120 })
    doc.fillColor(BLACK).text(String(value ?? '—'), 180, y, { width: 365 })
  })

  doc.moveDown(1.5)

  // Line items
  const extras = Array.isArray(booking.extras) ? booking.extras : []
  const extrasTotal = extras.reduce((sum, e) => sum + Number(e.price || 0), 0)
  const fare = Number(booking.total_price) - extrasTotal

  doc.font('Helvetica-Bold').fillColor(BLACK).fontSize(11).text('Charges')
  doc.moveDown(0.3)

  const tableTop = doc.y
  doc.font('Helvetica-Bold').fontSize(10)
  doc.text('Description', 50, tableTop, { width: 400 })
  doc.text('Amount', 450, tableTop, { width: 95, align: 'right' })
  doc.moveDown(0.5)
  doc.strokeColor('#e5e5e5').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(0.5)

  doc.font('Helvetica').fontSize(10)
  const rowLine = (label, amount, bold = false) => {
    const y = doc.y
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
    doc.fillColor(BLACK).text(label, 50, y, { width: 400 })
    doc.text(money(amount), 450, y, { width: 95, align: 'right' })
    doc.moveDown(0.5)
  }

  rowLine(`Fare (${booking.vehicle_name || 'vehicle'})`, fare)
  extras.forEach((e) => rowLine(e.name, e.price))

  doc.strokeColor('#e5e5e5').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(0.5)
  doc.fillColor(GOLD)
  rowLine('Total (Incl. GST)', booking.total_price, true)

  doc.moveDown(1.5)
  doc.font('Helvetica-Bold').fillColor(BLACK).fontSize(10).text('Payment status: ', 50, doc.y, { continued: true })
  doc.font('Helvetica').fillColor(GREY).text(
    booking.payment_status === 'paid' ? 'Paid' : booking.payment_status.replace('_', ' '),
  )

  doc.moveDown(2)
  doc.strokeColor('#e5e5e5').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(0.8)
  // Explicit x/width here — without it, text() inherits the narrow x=450
  // column left over from the charges table above and wraps badly.
  doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK).text(
    'Thank you for riding with BlackStone Chauffeur.',
    50, doc.y, { width: 495, align: 'center' },
  )
  doc.moveDown(0.3)
  doc.font('Helvetica').fontSize(9).fillColor(GREY).text(
    "It was a pleasure driving you, and we hope to welcome you aboard again soon. If anything about this invoice doesn't look right, just reply to your booking confirmation email and we'll sort it out.",
    50, doc.y, { width: 495, align: 'center' },
  )

  doc.end()
}
