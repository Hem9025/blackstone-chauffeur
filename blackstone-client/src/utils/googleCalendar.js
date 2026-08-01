// Builds a "prefilled event" Google Calendar link — no OAuth, no API keys,
// no account connection required. Clicking it opens Google Calendar (web or
// app) with the booking's details already filled in; the driver/admin just
// hits Save. This is intentionally NOT a live sync — it's a one-click way
// to get an individual ride onto whichever calendar the person already uses.

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatForGoogle(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
}

export function googleCalendarUrl(booking) {
  const day = new Date(booking.date)
  const [hh = '00', mm = '00'] = String(booking.time || '00:00').split(':')
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(hh), Number(mm))

  const durationMin = Number(booking.duration_min) > 0 ? Number(booking.duration_min) : 60
  const end = new Date(start.getTime() + durationMin * 60000)

  const passenger = booking.passenger_name || booking.customer_name || 'Passenger'
  const title = `BlackStone Chauffeur — ${passenger}`

  const detailLines = [
    `Booking #${booking.id}`,
    `Passenger: ${passenger}`,
    booking.vehicle_name ? `Vehicle: ${booking.vehicle_name}` : null,
    `Pickup: ${booking.pickup}`,
    `Drop-off: ${booking.dropoff}`,
  ].filter(Boolean)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatForGoogle(start)}/${formatForGoogle(end)}`,
    details: detailLines.join('\n'),
    location: booking.pickup || '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
