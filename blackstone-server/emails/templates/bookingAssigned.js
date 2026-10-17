import { layout } from './layout.js'
import { escapeHtml } from '../escapeHtml.js'

// Sent to a driver when they're assigned a ride. driverName is admin-managed
// (not something a customer controls), but everything else — addresses,
// passenger details, notes — is free text a customer or provider typed in,
// so escape everything interpolated here rather than trying to reason
// case-by-case about which fields could ever contain someone else's input.
//
// Optional fields (everything after `time`) are simply left out of the email
// when they're blank, so a booking with no flight number or notes doesn't
// show empty rows.
export function bookingAssignedTemplate({
  driverName,
  pickup,
  dropoff,
  date,
  time,
  passengerName,
  passengerPhone,
  passengerEmail,
  vehicleName,
  passengers,
  suitcases,
  childSeats,
  flightNumber,
  hours,
  stopAddresses = [],
  notes,
}) {
  const row = (label, valueHtml) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#6b6b6b;vertical-align:top;white-space:nowrap;">${label}</td><td style="padding:6px 0;">${valueHtml}</td></tr>`

  const has = (v) => v !== null && v !== undefined && String(v).trim() !== ''

  // Phone is only turned into a tappable tel: link after stripping it down
  // to digits/+ — never interpolate raw user text into an href.
  const phoneHref = has(passengerPhone) ? String(passengerPhone).replace(/[^0-9+]/g, '') : ''

  const cleanStops = Array.isArray(stopAddresses) ? stopAddresses.filter(has) : []

  const rideRows = [
    row('Pickup', escapeHtml(pickup)),
    // An hourly booking has no fixed destination.
    row('Drop-off', has(dropoff) ? escapeHtml(dropoff) : 'As directed'),
    cleanStops.length
      ? row('Stops', cleanStops.map((s, i) => `${i + 1}. ${escapeHtml(s)}`).join('<br>'))
      : '',
    row('Date', escapeHtml(date)),
    row('Time', escapeHtml(time)),
    has(hours) ? row('Duration', `${escapeHtml(hours)} hour${Number(hours) === 1 ? '' : 's'}`) : '',
    has(flightNumber) ? row('Flight number', escapeHtml(flightNumber)) : '',
  ].join('')

  const passengerRows = [
    has(passengerName) ? row('Passenger', escapeHtml(passengerName)) : '',
    has(passengerPhone)
      ? row('Phone', phoneHref ? `<a href="tel:${phoneHref}" style="color:#0a0a0a;">${escapeHtml(passengerPhone)}</a>` : escapeHtml(passengerPhone))
      : '',
    has(passengerEmail)
      ? row('Email', `<a href="mailto:${escapeHtml(passengerEmail)}" style="color:#0a0a0a;">${escapeHtml(passengerEmail)}</a>`)
      : '',
    has(passengers) ? row('Passengers', escapeHtml(passengers)) : '',
    has(suitcases) ? row('Luggage', `${escapeHtml(suitcases)} bag${Number(suitcases) === 1 ? '' : 's'}`) : '',
    Number(childSeats) > 0 ? row('Child seats', escapeHtml(childSeats)) : '',
    has(vehicleName) ? row('Vehicle', escapeHtml(vehicleName)) : '',
    has(notes) ? row('Notes', escapeHtml(notes)) : '',
  ].join('')

  return layout({
    preheader: 'A new ride has been assigned to you',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">New Ride Assigned</h2>
      <p>Hi ${escapeHtml(driverName)},</p>
      <p>You've been assigned a new ride:</p>
      <h3 style="margin:20px 0 4px;color:#0a0a0a;font-size:15px;">Trip</h3>
      <table role="presentation" style="width:100%;border-collapse:collapse;">${rideRows}</table>
      ${passengerRows
        ? `<h3 style="margin:20px 0 4px;color:#0a0a0a;font-size:15px;">Passenger &amp; requirements</h3>
      <table role="presentation" style="width:100%;border-collapse:collapse;">${passengerRows}</table>`
        : ''}
      <p style="margin-top:20px;">You can also see this ride, and update its status, in your driver dashboard.</p>
    `,
  })
}
