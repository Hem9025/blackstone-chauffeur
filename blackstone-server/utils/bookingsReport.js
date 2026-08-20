import PDFDocument from 'pdfkit'

const GOLD = '#c9a227'
const BLACK = '#0a0a0a'
const GREY = '#6b6b6b'

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`
}

const COLUMNS = [
  { key: 'date', label: 'Date', width: 60 },
  { key: 'passenger', label: 'Passenger', width: 90 },
  { key: 'route', label: 'Route', width: 190 },
  { key: 'vehicle_name', label: 'Vehicle', width: 80 },
  { key: 'booking_status', label: 'Status', width: 60 },
  { key: 'total_price', label: 'Total', width: 62 },
]

/**
 * Streams a landscape tabular PDF report of a booking list directly to an
 * Express response — used for the admin/provider "download as PDF" export.
 */
export function streamBookingsReport(res, bookings, title) {
  const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${title.toLowerCase().replace(/\s+/g, '-')}.pdf"`)
  doc.pipe(res)

  doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(16).text('BlackStone Chauffeur')
  doc.fillColor(GOLD).font('Helvetica').fontSize(10).text(title)
  doc.fillColor(GREY).fontSize(8).text(`Generated ${new Date().toLocaleDateString('en-NZ')} — ${bookings.length} booking(s)`)
  doc.moveDown(1)

  const startX = 40
  // PDFKit has no built-in table layout — `y` is tracked by hand and
  // advanced a fixed 16px per row (drawRow below) since every row uses the
  // same fixed 8pt font, so line height never varies row to row.
  let y = doc.y

  // Draws one row of cells left-to-right at the current `y`, each column
  // clipped to its configured width with an ellipsis rather than wrapping —
  // a table row that wrapped to two lines would silently break every
  // following row's fixed 16px vertical spacing.
  function drawRow(values, { bold = false, color = BLACK } = {}) {
    let x = startX
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor(color)
    COLUMNS.forEach((col, i) => {
      doc.text(String(values[i] ?? '—'), x, y, { width: col.width, ellipsis: true })
      x += col.width
    })
    y += 16
  }

  drawRow(COLUMNS.map((c) => c.label), { bold: true })
  doc.strokeColor('#e5e5e5').lineWidth(1).moveTo(startX, y).lineTo(startX + COLUMNS.reduce((s, c) => s + c.width, 0), y).stroke()
  y += 4

  bookings.forEach((b) => {
    // 540 is the last safe y before A4-landscape's bottom margin at this
    // page size/margin combo — start a fresh page (with its own header
    // row-free body, matching how the rest of this report is laid out)
    // rather than letting rows run off the bottom of the page.
    if (y > 540) {
      doc.addPage({ size: 'A4', margin: 40, layout: 'landscape' })
      y = 40
    }
    drawRow([
      b.date ? new Date(b.date).toLocaleDateString('en-NZ') : '—',
      b.passenger_name || b.customer_name || '—',
      `${b.pickup || ''} -> ${b.dropoff || ''}`,
      b.vehicle_name || '—',
      b.booking_status,
      money(b.total_price),
    ])
  })

  doc.end()
}
