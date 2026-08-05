import { Router } from 'express'
import Stripe from 'stripe'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'
import { sendMail } from '../emails/mailer.js'
import { bookingConfirmationTemplate } from '../emails/templates/bookingConfirmation.js'
import { bookingAssignedTemplate } from '../emails/templates/bookingAssigned.js'
import { rideReceiptTemplate } from '../emails/templates/rideReceipt.js'
import { newBookingAdminTemplate } from '../emails/templates/newBookingAdmin.js'
import { bookingCancelledTemplate } from '../emails/templates/bookingCancelled.js'
import { calculateFare, resolveExtraWaitCharge } from '../utils/pricing.js'
import { streamInvoice } from '../utils/invoice.js'
import { streamBookingsReport } from '../utils/bookingsReport.js'
import { isDateFarEnoughAhead, MIN_ADVANCE_DAYS } from '../utils/bookingRules.js'
import { parseWhatsappBooking } from '../utils/parseWhatsappBooking.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Quantity-based add-ons — priced per unit from the add_ons table rather
// than as a one-time flat toggle like Champagne/Meet & Greet/etc.
const CHILD_SEAT_MAX = 2
const QUANTITY_ADDON_NAMES = ['Child Seat', 'Additional Stop']

// Looks up unit prices for Child Seat / Additional Stop from the DB (never
// trust a client-supplied price) and returns their combined total for the
// given quantities.
async function quantityAddOnsTotal(childSeats, stops) {
  if (!childSeats && !stops) return 0
  const { rows } = await query('SELECT name, price FROM add_ons WHERE name IN (?)', [QUANTITY_ADDON_NAMES])
  const childSeatPrice = Number(rows.find((r) => r.name === 'Child Seat')?.price) || 0
  const stopPrice = Number(rows.find((r) => r.name === 'Additional Stop')?.price) || 0
  return childSeatPrice * childSeats + stopPrice * stops
}

// Shared by GET /my and GET /all — builds a safe WHERE/ORDER BY from
// whitelisted query params only, so filter/sort never touches raw SQL from
// the client.
const SORT_OPTIONS = {
  date_desc: 'b.date DESC, b.time DESC',
  date_asc: 'b.date ASC, b.time ASC',
  created_desc: 'b.created_at DESC',
  created_asc: 'b.created_at ASC',
  price_desc: 'b.total_price DESC',
  price_asc: 'b.total_price ASC',
}

function buildBookingFilters(query) {
  const clauses = []
  const params = []

  if (query.status) {
    clauses.push('b.booking_status = ?')
    params.push(query.status)
  }
  if (query.payment_status) {
    clauses.push('b.payment_status = ?')
    params.push(query.payment_status)
  }
  if (query.date_from) {
    clauses.push('b.date >= ?')
    params.push(query.date_from)
  }
  if (query.date_to) {
    clauses.push('b.date <= ?')
    params.push(query.date_to)
  }
  // Used by the admin Drivers & Providers panel to pull one person's actual
  // booking list (not just aggregate counts) — driver_id matches the ride
  // they fulfil, provider_id matches bookings.customer_id (the account that
  // placed the booking), same distinction used everywhere else in this file.
  if (query.driver_id) {
    clauses.push('b.driver_id = ?')
    params.push(query.driver_id)
  }
  if (query.provider_id) {
    clauses.push('b.customer_id = ?')
    params.push(query.provider_id)
  }

  const orderClause = SORT_OPTIONS[query.sort] || SORT_OPTIONS.created_desc
  return { whereExtra: clauses.length ? `AND ${clauses.join(' AND ')}` : '', params, orderClause }
}

// POST /api/bookings — customer, create booking + Stripe PaymentIntent
// Price is always recalculated server-side from the vehicle's distance
// tiers + add-on prices looked up in the DB — the client's total_price is
// never trusted directly, since it's easy to tamper with in the browser.
router.post('/', authCheck, requireRole('customer'), async (req, res) => {
  const {
    vehicle_id, pickup, dropoff, date, time, extras, distance_km, duration_min,
    trip_type, service_type, hours, flight_number, stops, stop_addresses, child_seats, notes,
    passengers, suitcases, extra_wait_minutes,
  } = req.body || {}

  if (!isDateFarEnoughAhead(date)) {
    return res.status(400).json({ message: `Bookings must be made at least ${MIN_ADVANCE_DAYS} days in advance.` })
  }

  if (!pickup || !date || !time) {
    return res.status(400).json({ message: 'pickup, date, and time are required' })
  }

  const resolvedTripType = ['one_way', 'return', 'hourly'].includes(trip_type) ? trip_type : 'one_way'
  const resolvedServiceType = service_type === 'Airport Transfer' ? 'Airport Transfer' : 'Chauffeur Service'
  const isHourly = resolvedTripType === 'hourly'
  const needsDropoff = !isHourly

  if (needsDropoff && !dropoff) {
    return res.status(400).json({ message: 'Destination is required for this trip type' })
  }
  if (isHourly && (!hours || Number(hours) <= 0)) {
    return res.status(400).json({ message: 'Please select the number of hours for an hourly booking' })
  }

  const resolvedChildSeats = Math.min(CHILD_SEAT_MAX, Math.max(0, Number(child_seats) || 0))
  // Stop addresses are the source of truth for the count when provided —
  // an Hourly booking has no dropoff/route, so stops never apply to it.
  const resolvedStopAddresses = needsDropoff && Array.isArray(stop_addresses)
    ? stop_addresses.map((a) => String(a || '').trim()).filter(Boolean)
    : []
  const resolvedStops = resolvedStopAddresses.length || (needsDropoff ? Math.max(0, Number(stops) || 0) : 0)
  const resolvedFlightNumber = resolvedServiceType === 'Airport Transfer' ? (flight_number || null) : null
  const resolvedNotes = String(notes || '').trim().slice(0, 250) || null

  // Hourly bookings are "as directed" — no fixed dropoff, so dropoff/
  // distance/duration are never trusted from the client for them —
  // recomputed here regardless of what the request body sent.
  const resolvedDropoff = needsDropoff ? dropoff : 'As directed (Hourly)'
  const resolvedDistanceKm = needsDropoff ? distance_km : null
  const resolvedDurationMin = isHourly ? Number(hours) * 60 : needsDropoff ? duration_min : 0
  const resolvedHours = isHourly ? Number(hours) : null

  try {
    const { rows: vehicleRows } = await query('SELECT * FROM vehicles WHERE id = ? AND active = true', [vehicle_id])
    if (!vehicleRows.length) return res.status(400).json({ message: 'Invalid vehicle selected' })
    const vehicle = vehicleRows[0]

    // Clamped to this vehicle's actual capacity — never trust a
    // client-supplied count beyond what the vehicle can actually carry.
    const resolvedPassengers = Math.min(
      Math.max(1, Number(passengers) || 1),
      Number(vehicle.passengers) || 1,
    )
    const resolvedSuitcases = Math.min(
      Math.max(0, Number(suitcases) || 0),
      Number(vehicle.suitcases) || 0,
    )

    // Look up real add-on prices by name — never trust a client-supplied price.
    const requestedNames = (extras || []).map((e) => e?.name).filter(Boolean)
    let matchedAddOns = []
    if (requestedNames.length) {
      const { rows } = await query('SELECT name, price FROM add_ons WHERE name IN (?)', [requestedNames])
      matchedAddOns = rows
    }
    // Extra Wait Time is priced per-minute (slider), not a flat add_ons
    // table lookup — clamp + price it server-side, then fold it into the
    // same extras list so it still shows on invoices/admin like any other
    // add-on, without needing a dedicated DB column.
    const { minutes: resolvedExtraWaitMinutes, price: extraWaitCharge } = resolveExtraWaitCharge(extra_wait_minutes)
    if (extraWaitCharge > 0) {
      matchedAddOns = [...matchedAddOns, { name: `Extra Wait Time (${resolvedExtraWaitMinutes} min)`, price: extraWaitCharge }]
    }
    const flatAddOnsTotal = matchedAddOns.reduce((sum, a) => sum + Number(a.price), 0)
    const qtyAddOnsTotal = await quantityAddOnsTotal(resolvedChildSeats, resolvedStops)
    const addOnsTotal = flatAddOnsTotal + qtyAddOnsTotal

    const total_price = calculateFare({
      vehicle,
      distanceKm: resolvedDistanceKm,
      durationMin: resolvedDurationMin,
      passengers: resolvedPassengers,
      suitcases: resolvedSuitcases,
      addOnsTotal,
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total_price * 100),
      currency: 'nzd',
      metadata: { customer_id: String(req.user.id) },
    })

    const inserted = await query(
      `INSERT INTO bookings
        (customer_id, vehicle_id, pickup, dropoff, date, time, trip_type, service_type, hours,
         flight_number, stops, stop_addresses, child_seats, notes, extras, total_price,
         distance_km, duration_min, payment_status, booking_status, stripe_payment_intent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)`,
      [
        req.user.id,
        vehicle_id,
        pickup,
        resolvedDropoff,
        date,
        time,
        resolvedTripType,
        resolvedServiceType,
        resolvedHours,
        resolvedFlightNumber,
        resolvedStops,
        resolvedStopAddresses.length ? JSON.stringify(resolvedStopAddresses) : null,
        resolvedChildSeats,
        resolvedNotes,
        JSON.stringify(matchedAddOns),
        total_price,
        resolvedDistanceKm || null,
        resolvedDurationMin || null,
        paymentIntent.id,
      ],
    )
    const { rows } = await query('SELECT * FROM bookings WHERE id = ?', [inserted.insertId])

    res.status(201).json({ booking: rows[0], client_secret: paymentIntent.client_secret, total_price })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create booking' })
  }
})

// POST /api/bookings/parse-whatsapp — admin or provider. Takes raw pasted
// text (e.g. copied straight out of a WhatsApp chat) and returns a
// best-effort guess at each booking field. This never touches the
// database — it's purely a convenience for pre-filling the New Booking
// form, which the admin/provider still reviews and edits before anything
// is created.
router.post('/parse-whatsapp', authCheck, requireRole('admin', 'provider'), (req, res) => {
  const { text } = req.body || {}
  const parsed = parseWhatsappBooking(text)
  res.json(parsed)
})

// POST /api/bookings/provider — provider or admin creates a booking on
// behalf of a client (a provider's own client, or — for admin — someone who
// messaged in directly, e.g. via WhatsApp, and never used the site). No
// Stripe step: the fare is invoiced/settled outside the system (see GET
// /:id/invoice), so payment_status starts and stays 'pending' until an
// admin marks it paid.
router.post('/provider', authCheck, requireRole('provider', 'admin'), async (req, res) => {
  const {
    vehicle_id, passenger_name, passenger_phone, passenger_email,
    pickup, dropoff, date, time, extras, distance_km, duration_min,
    trip_type, service_type, hours, flight_number, stops, stop_addresses, child_seats, notes,
    passengers, suitcases,
  } = req.body || {}

  if (!passenger_name || !pickup || !date || !time || !vehicle_id) {
    return res.status(400).json({ message: 'passenger_name, vehicle_id, pickup, date, and time are required' })
  }

  // Unlike the customer-facing POST / route, provider/admin bookings skip
  // the MIN_ADVANCE_DAYS check entirely — dispatch trusts staff to book
  // last-minute or even same-day rides on a client's behalf.

  const resolvedTripType = ['one_way', 'return', 'hourly'].includes(trip_type) ? trip_type : 'one_way'
  const resolvedServiceType = service_type === 'Airport Transfer' ? 'Airport Transfer' : 'Chauffeur Service'
  const isHourly = resolvedTripType === 'hourly'
  const needsDropoff = !isHourly

  if (needsDropoff && !dropoff) {
    return res.status(400).json({ message: 'Destination is required for this trip type' })
  }
  if (isHourly && (!hours || Number(hours) <= 0)) {
    return res.status(400).json({ message: 'Please select the number of hours for an hourly booking' })
  }

  const resolvedChildSeats = Math.min(CHILD_SEAT_MAX, Math.max(0, Number(child_seats) || 0))
  const resolvedStopAddresses = needsDropoff && Array.isArray(stop_addresses)
    ? stop_addresses.map((a) => String(a || '').trim()).filter(Boolean)
    : []
  const resolvedStops = resolvedStopAddresses.length || (needsDropoff ? Math.max(0, Number(stops) || 0) : 0)
  const resolvedFlightNumber = resolvedServiceType === 'Airport Transfer' ? (flight_number || null) : null
  const resolvedNotes = String(notes || '').trim().slice(0, 250) || null

  const resolvedDropoff = needsDropoff ? dropoff : 'As directed (Hourly)'
  const resolvedDistanceKm = needsDropoff ? distance_km : null
  const resolvedDurationMin = isHourly ? Number(hours) * 60 : needsDropoff ? duration_min : 0
  const resolvedHours = isHourly ? Number(hours) : null

  try {
    const { rows: vehicleRows } = await query('SELECT * FROM vehicles WHERE id = ? AND active = true', [vehicle_id])
    if (!vehicleRows.length) return res.status(400).json({ message: 'Invalid vehicle selected' })
    const vehicle = vehicleRows[0]

    // Clamped to this vehicle's actual capacity — never trust a
    // client-supplied count beyond what the vehicle can actually carry.
    const resolvedPassengers = Math.min(
      Math.max(1, Number(passengers) || 1),
      Number(vehicle.passengers) || 1,
    )
    const resolvedSuitcases = Math.min(
      Math.max(0, Number(suitcases) || 0),
      Number(vehicle.suitcases) || 0,
    )

    const requestedNames = (extras || []).map((e) => e?.name).filter(Boolean)
    let matchedAddOns = []
    if (requestedNames.length) {
      const { rows } = await query('SELECT name, price FROM add_ons WHERE name IN (?)', [requestedNames])
      matchedAddOns = rows
    }
    const flatAddOnsTotal = matchedAddOns.reduce((sum, a) => sum + Number(a.price), 0)
    const qtyAddOnsTotal = await quantityAddOnsTotal(resolvedChildSeats, resolvedStops)
    const addOnsTotal = flatAddOnsTotal + qtyAddOnsTotal

    const total_price = calculateFare({
      vehicle,
      distanceKm: resolvedDistanceKm,
      durationMin: resolvedDurationMin,
      passengers: resolvedPassengers,
      suitcases: resolvedSuitcases,
      addOnsTotal,
    })

    const inserted = await query(
      `INSERT INTO bookings
        (customer_id, vehicle_id, pickup, dropoff, date, time, passenger_name, passenger_phone, passenger_email,
         trip_type, service_type, hours, flight_number, stops, stop_addresses, child_seats, notes,
         extras, total_price, distance_km, duration_min, payment_status, booking_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
      [
        req.user.id,
        vehicle_id,
        pickup,
        resolvedDropoff,
        date,
        time,
        passenger_name,
        passenger_phone || null,
        passenger_email || null,
        resolvedTripType,
        resolvedServiceType,
        resolvedHours,
        resolvedFlightNumber,
        resolvedStops,
        resolvedStopAddresses.length ? JSON.stringify(resolvedStopAddresses) : null,
        resolvedChildSeats,
        resolvedNotes,
        JSON.stringify(matchedAddOns),
        total_price,
        resolvedDistanceKm || null,
        resolvedDurationMin || null,
      ],
    )
    const { rows } = await query('SELECT * FROM bookings WHERE id = ?', [inserted.insertId])

    // Provider bookings skip Stripe entirely (invoiced outside the system),
    // so there's no /confirm step to hang the admin notification off —
    // send it right here instead. Skip it when an admin created the
    // booking themselves (e.g. from a pasted WhatsApp message) — they
    // don't need to be notified of their own action.
    if (process.env.ADMIN_EMAIL && req.user.role !== 'admin') {
      sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: `New booking — ${passenger_name} (via provider)`,
        html: newBookingAdminTemplate({
          customerName: passenger_name,
          vehicleName: vehicle.name,
          serviceType: resolvedServiceType,
          pickup,
          dropoff: resolvedDropoff,
          date,
          time,
          hours: resolvedHours,
          totalPrice: total_price,
        }),
      }).catch((err) => console.error('Failed to send new-booking-admin email', err))
    }

    res.status(201).json({ booking: rows[0], total_price })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create booking' })
  }
})

// POST /api/bookings/confirm — mark paid + send confirmation emails.
// Called by the client right after Stripe reports a successful payment.
// Never trusts that claim on its own, though — it re-checks the booking's
// own PaymentIntent directly with Stripe before marking anything paid, and
// only the booking's owner (or an admin) is allowed to confirm it. Safe to
// call more than once — already-paid bookings short-circuit before any
// email goes out again.
router.post('/confirm', authCheck, async (req, res) => {
  const { booking_id } = req.body || {}
  if (!booking_id) return res.status(400).json({ message: 'booking_id is required' })

  try {
    const { rows } = await query(
      `SELECT b.*, u.name AS customer_name, u.email AS customer_email, v.name AS vehicle_name
       FROM bookings b
       JOIN users u ON u.id = b.customer_id
       LEFT JOIN vehicles v ON v.id = b.vehicle_id
       WHERE b.id = ?`,
      [booking_id],
    )
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' })

    const booking = rows[0]

    const isOwner = booking.customer_id === req.user.id
    const isAdmin = ['admin', 'second_admin'].includes(req.user.role)
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    if (booking.payment_status === 'paid') {
      return res.json(booking)
    }

    if (!booking.stripe_payment_intent_id) {
      return res.status(400).json({ message: 'This booking has no payment to confirm' })
    }
    const intent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ message: `Payment has not gone through yet (status: ${intent.status})` })
    }

    await query(`UPDATE bookings SET payment_status = 'paid' WHERE id = ?`, [booking_id])
    booking.payment_status = 'paid'

    if (booking.customer_email) {
      sendMail({
        to: booking.customer_email,
        subject: 'Booking confirmed — BlackStone Chauffeur',
        html: bookingConfirmationTemplate({
          customerName: booking.customer_name,
          pickup: booking.pickup,
          dropoff: booking.dropoff,
          date: booking.date,
          time: booking.time,
          totalPrice: booking.total_price,
        }),
      }).catch((err) => console.error('Failed to send booking-confirmation email', err))
    }

    // Admin gets notified the moment a customer booking is actually paid for
    // — an unpaid/abandoned checkout attempt never reaches this route, so
    // this only fires for bookings that are genuinely going ahead.
    if (process.env.ADMIN_EMAIL) {
      sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: `New booking — ${booking.customer_name}`,
        html: newBookingAdminTemplate({
          customerName: booking.passenger_name || booking.customer_name,
          vehicleName: booking.vehicle_name || 'Unassigned',
          serviceType: booking.service_type || 'Chauffeur Service',
          pickup: booking.pickup,
          dropoff: booking.dropoff,
          date: booking.date,
          time: booking.time,
          hours: booking.hours,
          totalPrice: booking.total_price,
        }),
      }).catch((err) => console.error('Failed to send new-booking-admin email', err))
    }

    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to confirm booking' })
  }
})

// GET /api/bookings/my — customer or provider, own bookings (provider sees
// bookings they placed on behalf of clients — passenger_name/passenger_phone
// identify who actually rode). Supports ?status=&payment_status=&date_from=&date_to=&sort=
router.get('/my', authCheck, requireRole('customer', 'provider'), async (req, res) => {
  try {
    const { whereExtra, params, orderClause } = buildBookingFilters(req.query)
    const { rows } = await query(
      `SELECT b.*, v.name AS vehicle_name
       FROM bookings b
       LEFT JOIN vehicles v ON v.id = b.vehicle_id
       WHERE b.customer_id = ? ${whereExtra}
       ORDER BY ${orderClause}`,
      [req.user.id, ...params],
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load bookings' })
  }
})

// GET /api/bookings/all — admin/second_admin, with optional filters.
// Supports ?status=&payment_status=&date_from=&date_to=&sort=
router.get('/all', authCheck, requireRole('admin', 'second_admin'), async (req, res) => {
  try {
    const { whereExtra, params, orderClause } = buildBookingFilters(req.query)
    const { rows } = await query(
      `SELECT b.*, v.name AS vehicle_name, u.name AS customer_name, u.email AS customer_email
       FROM bookings b
       LEFT JOIN vehicles v ON v.id = b.vehicle_id
       LEFT JOIN users u ON u.id = b.customer_id
       WHERE 1 = 1 ${whereExtra}
       ORDER BY ${orderClause}`,
      params,
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load bookings' })
  }
})

// GET /api/bookings/my/report — same rows as GET /my, as a downloadable PDF.
router.get('/my/report', authCheck, requireRole('customer', 'provider'), async (req, res) => {
  try {
    const { whereExtra, params, orderClause } = buildBookingFilters(req.query)
    const { rows } = await query(
      `SELECT b.*, v.name AS vehicle_name
       FROM bookings b
       LEFT JOIN vehicles v ON v.id = b.vehicle_id
       WHERE b.customer_id = ? ${whereExtra}
       ORDER BY ${orderClause}`,
      [req.user.id, ...params],
    )
    streamBookingsReport(res, rows, 'My Bookings')
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to generate report' })
  }
})

// GET /api/bookings/all/report — same rows as GET /all, as a downloadable PDF.
router.get('/all/report', authCheck, requireRole('admin', 'second_admin'), async (req, res) => {
  try {
    const { whereExtra, params, orderClause } = buildBookingFilters(req.query)
    const { rows } = await query(
      `SELECT b.*, v.name AS vehicle_name, u.name AS customer_name, u.email AS customer_email
       FROM bookings b
       LEFT JOIN vehicles v ON v.id = b.vehicle_id
       LEFT JOIN users u ON u.id = b.customer_id
       WHERE 1 = 1 ${whereExtra}
       ORDER BY ${orderClause}`,
      params,
    )
    streamBookingsReport(res, rows, 'All Bookings')
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to generate report' })
  }
})

// PATCH /api/bookings/:id/cancel — customer/provider can cancel their own
// booking (customer_id owns it either way); admin/second_admin can cancel any.
router.patch('/:id/cancel', authCheck, async (req, res) => {
  try {
    const { rows: existingRows } = await query(
      `SELECT b.*, v.name AS vehicle_name,
              cu.name AS customer_name, cu.email AS customer_email,
              du.name AS driver_name, du.email AS driver_email
       FROM bookings b
       LEFT JOIN vehicles v ON v.id = b.vehicle_id
       LEFT JOIN users cu ON cu.id = b.customer_id
       LEFT JOIN users du ON du.id = b.driver_id
       WHERE b.id = ?`,
      [req.params.id],
    )
    if (!existingRows.length) return res.status(404).json({ message: 'Booking not found' })
    const booking = existingRows[0]

    const isOwner = booking.customer_id === req.user.id
    const isAdmin = ['admin', 'second_admin'].includes(req.user.role)
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    if (['completed', 'cancelled'].includes(booking.booking_status)) {
      return res.status(400).json({ message: `Booking is already ${booking.booking_status}` })
    }

    await query(`UPDATE bookings SET booking_status = 'cancelled' WHERE id = ?`, [req.params.id])

    const emailDetails = {
      vehicleName: booking.vehicle_name || 'Unassigned',
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      date: booking.date,
      time: booking.time,
    }

    if (booking.customer_email) {
      sendMail({
        to: booking.customer_email,
        subject: 'Booking cancelled — BlackStone Chauffeur',
        html: bookingCancelledTemplate({
          recipientName: booking.customer_name,
          greetingContext: isAdmin && !isOwner
            ? 'Your booking has been cancelled by BlackStone Chauffeur. Get in touch if this is unexpected.'
            : 'This confirms your booking has been cancelled.',
          ...emailDetails,
        }),
      }).catch((err) => console.error('Failed to send cancellation email to customer', err))
    }

    if (booking.driver_email) {
      sendMail({
        to: booking.driver_email,
        subject: 'Ride cancelled — BlackStone Chauffeur',
        html: bookingCancelledTemplate({
          recipientName: booking.driver_name,
          greetingContext: 'A ride assigned to you has been cancelled — no action needed.',
          ...emailDetails,
        }),
      }).catch((err) => console.error('Failed to send cancellation email to driver', err))
    }

    if (process.env.ADMIN_EMAIL) {
      sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: `Booking cancelled — ${booking.passenger_name || booking.customer_name}`,
        html: bookingCancelledTemplate({
          recipientName: 'Admin',
          greetingContext: `${booking.passenger_name || booking.customer_name} cancelled the following booking.`,
          ...emailDetails,
        }),
      }).catch((err) => console.error('Failed to send cancellation email to admin', err))
    }

    const { rows } = await query('SELECT * FROM bookings WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to cancel booking' })
  }
})

// DELETE /api/bookings/:id — admin/second_admin. Permanently removes a
// booking record entirely (unlike /cancel, which just marks it cancelled
// but keeps it in the list/reports). Meant for cleaning up test bookings,
// duplicates, or mistakes — not a normal part of the booking lifecycle.
router.delete('/:id', authCheck, requireRole('admin', 'second_admin'), async (req, res) => {
  try {
    const { rows: existingRows } = await query('SELECT id FROM bookings WHERE id = ?', [req.params.id])
    if (!existingRows.length) return res.status(404).json({ message: 'Booking not found' })

    await query('DELETE FROM bookings WHERE id = ?', [req.params.id])
    res.json({ message: 'Booking deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete booking' })
  }
})

// PATCH /api/bookings/:id/assign-driver — admin/second_admin
router.patch(
  '/:id/assign-driver',
  authCheck,
  requireRole('admin', 'second_admin'),
  async (req, res) => {
    const { driverId } = req.body || {}
    try {
      await query('UPDATE bookings SET driver_id = ? WHERE id = ?', [driverId, req.params.id])
      const { rows } = await query(
        `SELECT b.*, u.name AS driver_name, u.email AS driver_email
         FROM bookings b
         LEFT JOIN users u ON u.id = b.driver_id
         WHERE b.id = ?`,
        [req.params.id],
      )
      if (!rows.length) return res.status(404).json({ message: 'Booking not found' })

      const booking = rows[0]
      if (booking.driver_email) {
        sendMail({
          to: booking.driver_email,
          subject: 'New ride assigned — BlackStone Chauffeur',
          html: bookingAssignedTemplate({
            driverName: booking.driver_name,
            pickup: booking.pickup,
            dropoff: booking.dropoff,
            date: booking.date,
            time: booking.time,
          }),
        }).catch((err) => console.error('Failed to send booking-assigned email', err))
      }

      res.json(rows[0])
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Failed to assign driver' })
    }
  },
)

// PATCH /api/bookings/:id/status — driver, update ride status
router.patch('/:id/status', authCheck, requireRole('driver'), async (req, res) => {
  const { status } = req.body || {} // en_route | arrived | completed
  try {
    await query(
      'UPDATE bookings SET booking_status = ? WHERE id = ? AND driver_id = ?',
      [status, req.params.id, req.user.id],
    )
    const { rows } = await query(
      `SELECT b.*, u.name AS customer_name, u.email AS customer_email
       FROM bookings b
       JOIN users u ON u.id = b.customer_id
       WHERE b.id = ? AND b.driver_id = ?`,
      [req.params.id, req.user.id],
    )
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' })

    const booking = rows[0]
    if (status === 'completed' && booking.customer_email) {
      sendMail({
        to: booking.customer_email,
        subject: 'Your ride receipt — BlackStone Chauffeur',
        html: rideReceiptTemplate({
          customerName: booking.customer_name,
          pickup: booking.pickup,
          dropoff: booking.dropoff,
          date: booking.date,
          extras: booking.extras,
          totalPrice: booking.total_price,
        }),
      }).catch((err) => console.error('Failed to send ride-receipt email', err))
    }

    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update status' })
  }
})

// GET /api/bookings/driver — driver, their assigned bookings
router.get('/driver', authCheck, requireRole('driver'), async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM bookings WHERE driver_id = ? ORDER BY date, time',
      [req.user.id],
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load assigned rides' })
  }
})

// GET /api/bookings/drivers — admin/second_admin, active drivers for the
// "Assign Driver" dropdown. Lives here (rather than /api/admin, which is
// admin-only) so second_admin can use it too. Name is what the dropdown
// shows; id is what actually gets sent to PATCH /:id/assign-driver.
router.get('/drivers', authCheck, requireRole('admin', 'second_admin'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name FROM users WHERE role = 'driver' AND status = 'active' ORDER BY name`,
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load drivers' })
  }
})

// GET /api/bookings/:id/invoice — PDF invoice. Accessible to whoever owns
// the booking (the customer or provider who placed it) or admin/second_admin.
router.get('/:id/invoice', authCheck, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT b.*, v.name AS vehicle_name, u.name AS customer_name, u.email AS customer_email
       FROM bookings b
       LEFT JOIN vehicles v ON v.id = b.vehicle_id
       LEFT JOIN users u ON u.id = b.customer_id
       WHERE b.id = ?`,
      [req.params.id],
    )
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' })
    const booking = rows[0]

    const isOwner = booking.customer_id === req.user.id
    const isAdmin = ['admin', 'second_admin'].includes(req.user.role)
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    streamInvoice(res, booking)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to generate invoice' })
  }
})

export default router
