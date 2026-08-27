// CSV export for the admin Subscribers panel — same escaping approach as
// utils/bookingsCsv.js (RFC 4180: quote a field whenever it contains a
// comma or quote, doubling up any quotes inside it).
function csvCell(value) {
  const str = String(value ?? '').replace(/\r?\n/g, ' ')
  if (/[",]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'name', label: 'Name' },
  { key: 'source', label: 'Source' },
  { key: 'created_at', label: 'Subscribed' },
]

export function streamSubscribersCsv(res, subscribers) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"')

  const lines = [COLUMNS.map((c) => csvCell(c.label)).join(',')]

  subscribers.forEach((s) => {
    lines.push(
      [
        s.email || '',
        s.name || '',
        s.source || '',
        s.created_at ? new Date(s.created_at).toLocaleDateString('en-NZ') : '',
      ]
        .map(csvCell)
        .join(','),
    )
  })

  // Leading BOM so Excel opens this as UTF-8 rather than guessing wrong.
  res.send('﻿' + lines.join('\r\n'))
}
