import { Router } from 'express'
import Stripe from 'stripe'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'
import { requirePermission } from '../middleware/requirePermission.js'
import { sendMail } from '../emails/mailer.js'
import { bookingConfirmationTemplate } from '../emails/templates/bookingConfirmation.js'
import { bookingAssignedTemplate } from '../emails/templates/bookingAssigned.js'
import { driverReassignedTemplate } from '../emails/templates/driverReassigned.js'
import { rideReceiptTemplate } from '../emails/templates/rideReceipt.js'
import { newBookingAdminTemplate } from '../emails/templates/newBookingAdmin.js'
import { bookingCancelledTemplate } from '../emails/templates/bookingCancelled.js'
import { bookingUpdatedTemplate } from '../emails/templates/bookingUpdated.js'
import { calculateFare, resolveExtraWaitCharge } from '../utils/pricing.js'
import { streamInvoice } from '../utils/invoice.js'
import { streamBookingsReport } from '../utils/bookingsReport.js'
import { streamBookingsCsv } from '../utils/bookingsCsv.js'
import { isDateFarEnoughAhead, MIN_ADVANCE_DAYS } from '../utils/bookingRules.js'
import { notify, notifyAdmins } from '../utils/notify.js'
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
      time,
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
router.post('/parse-whatsapp', authCheck, requirePermission('can_manage_bookings', { alsoAllow: ['provider'] }), async (req, res) => {
  const { text } = req.body || {}
  try {
    const { rows: vehicles } = await query('SELECT id, name FROM vehicles WHERE active = true')
    const parsed = parseWhatsappBooking(text, vehicles)
    res.json(parsed)
  } catch (err) {
    console.error(err)
    // Vehicle-matching is a bonus, not essential — fall back to parsing
    // without it rather than failing the whole request.
    res.json(parseWhatsappBooking(text))
  }
})

// POST /api/bookings/provider — provider or admin creates a booking on
// behalf of a client (a provider's own client, or — for admin — someone who
// messaged in directly, e.g. via WhatsApp, and never used the site). No
// Stripe step: the fare is invoiced/settled outside the system (see GET
// /:id/invoice), so payment_status starts and stays 'pending' until an
// admin marks it paid.
router.post('/provider', authCheck, requirePermission('can_manage_bookings', { alsoAllow: ['provider'] }), async (req, res) => {
  const {
    vehicle_id, passenger_name, passenger_phone, passenger_email,
    pickup, dropoff, date, time, extras, distance_km, duration_min,
    trip_type, service_type, hours, flight_number, stops, stop_addresses, child_seats, notes, reference,
    passengers, suitcases, total_price: requestedTotalPrice,
    // Both optional, and both only ever honoured for admin/second_admin —
    // a 'provider' user hits this same route for their own bookings, and
    // must never be able to attribute a booking to a different provider
    // account or set another driver's pay.
    provider_id, driver_id, driver_price: requestedDriverPrice,
  } = req.body || {}
  const isStaff = req.user.role === 'admin' || req.user.role === 'second_admin'

  if (!passenger_name || !pickup || !date || !time || !vehicle_id) {
    return res.status(400).json({ message: 'passenger_name, vehicle_id, pickup, date, and time are required' })
  }

  // Provider/admin bookings are manually priced — the vehicle picker here is
  // just a quick-reference label (what the client will actually ride in),
  // it no longer drives the fare. The person creating the booking types the
  // final price themselves (e.g. a phone-negotiated rate). Price is
  // optional here (unlike the customer-facing POST / route, which always
  // computes one via calculateFare) — a rate that isn't settled yet can be
  // left blank and filled in later via PATCH /:id.
  const manualTotalPrice = requestedTotalPrice === '' || requestedTotalPrice == null
    ? 0
    : Number(requestedTotalPrice)
  if (!Number.isFinite(manualTotalPrice) || manualTotalPrice < 0) {
    return res.status(400).json({ message: 'Total price must be a valid non-negative number' })
  }
  const resolvedTotalPrice = Math.round(manualTotalPrice * 100) / 100

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
  const resolvedReference = String(reference || '').trim().slice(0, 100) || null

  const resolvedDropoff = needsDropoff ? dropoff : 'As directed (Hourly)'
  const resolvedDistanceKm = needsDropoff ? distance_km : null
  const resolvedDurationMin = isHourly ? Number(hours) * 60 : needsDropoff ? duration_min : 0
  const resolvedHours = isHourly ? Number(hours) : null

  try {
    // Vehicle is now just a quick-reference label on provider/admin bookings
    // (it no longer drives pricing), but the row is still required at the DB
    // level (vehicle_id is NOT NULL), so it still needs to resolve to a real,
    // active vehicle.
    const { rows: vehicleRows } = await query('SELECT * FROM vehicles WHERE id = ? AND active = true', [vehicle_id])
    if (!vehicleRows.length) return res.status(400).json({ message: 'Invalid vehicle selected' })
    const vehicle = vehicleRows[0]

    // Attribute the booking to a chosen provider instead of the creator's
    // own account — e.g. admin logging a booking that came in via a
    // specific agency. Optional; only admin/second_admin can set it.
    let resolvedCustomerId = req.user.id
    if (isStaff && provider_id) {
      const { rows: providerRows } = await query(
        `SELECT id FROM users WHERE id = ? AND role = 'provider' AND status = 'active'`,
        [provider_id],
      )
      if (!providerRows.length) return res.status(400).json({ message: 'Invalid provider selected' })
      resolvedCustomerId = providerRows[0].id
    }

    // Optional driver assignment + a separate driver payout figure at
    // creation time, as a shortcut for the usual /assign-driver flow.
    // driver_price is never derived from total_price — it's whatever admin
    // decides to pay the driver for this ride, and only ever shown to that
    // driver, never the customer.
    let resolvedDriverId = null
    let resolvedDriverPrice = null
    let assignedDriver = null
    if (isStaff && driver_id) {
      const { rows: driverRows } = await query(
        `SELECT id, name, email FROM users WHERE id = ? AND role = 'driver' AND status = 'active'`,
        [driver_id],
      )
      if (!driverRows.length) return res.status(400).json({ message: 'Invalid driver selected' })
      assignedDriver = driverRows[0]
      resolvedDriverId = assignedDriver.id
      if (requestedDriverPrice !== '' && requestedDriverPrice != null) {
        const price = Number(requestedDriverPrice)
        if (!Number.isFinite(price) || price < 0) {
          return res.status(400).json({ message: 'Driver price must be a valid non-negative number' })
        }
        resolvedDriverPrice = Math.round(price * 100) / 100
      }
    }

    // No longer clamped to the selected vehicle's capacity, since the
    // vehicle is reference-only here — just a sane upper bound so a stray
    // client value can't produce a nonsensical booking row.
    const resolvedPassengers = Math.min(Math.max(1, Number(passengers) || 1), 20)
    const resolvedSuitcases = Math.min(Math.max(0, Number(suitcases) || 0), 20)

    const requestedNames = (extras || []).map((e) => e?.name).filter(Boolean)
    let matchedAddOns = []
    if (requestedNames.length) {
      const { rows } = await query('SELECT name, price FROM add_ons WHERE name IN (?)', [requestedNames])
      matchedAddOns = rows
    }

    const total_price = resolvedTotalPrice

    const inserted = await query(
      `INSERT INTO bookings
        (customer_id, vehicle_id, driver_id, driver_price, pickup, dropoff, date, time, passenger_name, passenger_phone, passenger_email,
         trip_type, service_type, hours, flight_number, stops, stop_addresses, child_seats, notes, reference,
         extras, total_price, distance_km, duration_min, payment_status, booking_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
      [
        resolvedCustomerId,
        vehicle_id,
        resolvedDriverId,
        resolvedDriverPrice,
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
        resolvedReference,
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

    // Always fires, even when an admin created the booking themselves — a
    // solo operator running this alone still wants a record of what they
    // just created, and a second_admin (if one exists) should never be able
    // to miss a booking an admin logged. Deliberately not excluded via
    // excludeUserId the way cancellations are: this one doubles as a running
    // "what did I just do" log, not just a heads-up to someone else.
    notifyAdmins({
      type: 'booking_created',
      title: 'New Booking',
      message: `${passenger_name} — ${pickup} → ${resolvedDropoff}, ${date}${req.user.role === 'provider' ? ' (via provider)' : ''}`,
      link: '/admin',
    })
    // Staff attributed this to a different provider than whoever's
    // creating it (e.g. admin logging a booking on a provider's behalf) —
    // let that provider know it landed on their account.
    if (resolvedCustomerId !== req.user.id) {
      notify(resolvedCustomerId, {
        type: 'booking_created',
        title: 'New Booking Added to Your Account',
        message: `${passenger_name} — ${pickup} → ${resolvedDropoff}, ${date}`,
        link: '/provider',
      })
    }
    if (resolvedDriverId) {
      notify(resolvedDriverId, {
        type: 'driver_assigned',
        title: 'New Ride Assigned',
        message: `${date} at ${String(time).slice(0, 5)} — ${pickup} → ${resolvedDropoff}`,
        link: '/driver',
      })
    }

    // The passenger themselves has no account here (customer_id on this
    // booking is the provider/agent's own account) — this is the only
    // confirmation they'd otherwise ever get, so it always sends regardless
    // of who created the booking.
    if (passenger_email) {
      sendMail({
        to: passenger_email,
        subject: 'Booking confirmed — BlackStone Chauffeur',
        html: bookingConfirmationTemplate({
          customerName: passenger_name,
          pickup,
          dropoff: resolvedDropoff,
          date,
          time,
          totalPrice: total_price,
        }),
      }).catch((err) => console.error('Failed to send booking-confirmation email (provider booking)', err))
    }

    // Driver was assigned right at creation (rather than via the usual
    // /assign-driver step) — same notification either way.
    if (assignedDriver?.email) {
      sendMail({
        to: assignedDriver.email,
        subject: 'New ride assigned — BlackStone Chauffeur',
        html: bookingAssignedTemplate({
          driverName: assignedDriver.name,
          pickup,
          dropoff: resolvedDropoff,
          date,
          time,
        }),
      }).catch((err) => console.error('Failed to send booking-assigned email (provider booking)', err))
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

    notifyAdmins({
      type: 'booking_created',
      title: 'New Booking',
      message: `${booking.passenger_name || booking.customer_name} — ${booking.pickup} → ${booking.dropoff || 'Hourly'}, ${booking.date}`,
      link: '/admin',
    })

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
router.get('/all', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    const { whereExtra, params, orderClause } = buildBookingFilters(req.query)
    const { rows } = await query(
      `SELECT b.*, v.name AS vehicle_name, u.name AS customer_name, u.email AS customer_email, u.role AS customer_role
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
router.get('/all/report', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
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

// Shared by the two /person/... routes below — resolves :role/:id to a real
// driver or provider, then loads exactly the booking rows that person's
// admin detail page (and its Download PDF/CSV buttons) show: driver_id for
// a driver (the rides they fulfil), customer_id for a provider (the
// bookings they've placed on a client's behalf) — the same distinction
// buildBookingFilters uses everywhere else in this file.
async function loadPersonBookingsForReport(role, id, { date_from, date_to } = {}) {
  if (!['driver', 'provider'].includes(role)) {
    return { error: 'role must be "driver" or "provider"' }
  }
  const { rows: personRows } = await query('SELECT id, name FROM users WHERE id = ? AND role = ?', [id, role])
  if (!personRows.length) {
    return { error: `${role} not found` }
  }
  const joinColumn = role === 'driver' ? 'driver_id' : 'customer_id'
  // Optional month/date-range narrowing — same date_from/date_to convention
  // used by GET /all, so a chosen range means the same thing everywhere.
  const params = [id]
  let dateClause = ''
  if (date_from) {
    dateClause += ' AND b.date >= ?'
    params.push(date_from)
  }
  if (date_to) {
    dateClause += ' AND b.date <= ?'
    params.push(date_to)
  }
  const { rows } = await query(
    `SELECT b.*, v.name AS vehicle_name
     FROM bookings b
     LEFT JOIN vehicles v ON v.id = b.vehicle_id
     WHERE b.${joinColumn} = ?${dateClause}
     ORDER BY b.date DESC, b.time DESC`,
    params,
  )
  return { person: personRows[0], rows }
}

// GET /api/bookings/person/:role/:id/report — one driver/provider's full
// ride history as a downloadable PDF. Gated by can_view_stats (not
// can_manage_bookings, unlike /all/report) so it matches the permission
// that actually gates the Drivers/Providers admin pages this is downloaded
// from — a second_admin who can see those pages can also export from them.
router.get('/person/:role/:id/report', authCheck, requirePermission('can_view_stats'), async (req, res) => {
  try {
    const { role, id } = req.params
    const { person, rows, error } = await loadPersonBookingsForReport(role, id, req.query)
    if (error) return res.status(404).json({ message: error })
    streamBookingsReport(res, rows, `${person.name} — ${role === 'driver' ? 'Rides Fulfilled' : 'Bookings Placed'}`)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to generate report' })
  }
})

// GET /api/bookings/person/:role/:id/report-csv — same rows, as CSV.
router.get('/person/:role/:id/report-csv', authCheck, requirePermission('can_view_stats'), async (req, res) => {
  try {
    const { role, id } = req.params
    const { person, rows, error } = await loadPersonBookingsForReport(role, id, req.query)
    if (error) return res.status(404).json({ message: error })
    streamBookingsCsv(res, rows, `${person.name} — ${role === 'driver' ? 'Rides Fulfilled' : 'Bookings Placed'}`)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to generate CSV' })
  }
})

// PATCH /api/bookings/:id/cancel — customer/provider can cancel their own
// booking (customer_id owns it either way); admin/second_admin can cancel any.
router.patch('/:id/cancel', authCheck, async (req, res) => {
  try {
    const { rows: existingRows } = await query(
      `SELECT b.*, v.name AS vehicle_name,
              cu.name AS customer_name, cu.email AS customer_email, cu.role AS customer_role,
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

    const cancelSummary = `${booking.passenger_name || booking.customer_name} — ${booking.date}, ${booking.pickup} → ${booking.dropoff || 'Hourly'}`
    notifyAdmins({ type: 'booking_cancelled', title: 'Booking Cancelled', message: cancelSummary, link: '/admin' }, isAdmin ? req.user.id : null)
    if (booking.driver_id) {
      notify(booking.driver_id, { type: 'booking_cancelled', title: 'Ride Cancelled', message: cancelSummary, link: '/driver' })
    }
    if (booking.customer_role === 'provider' && !isOwner) {
      notify(booking.customer_id, { type: 'booking_cancelled', title: 'Your Booking Was Cancelled', message: cancelSummary, link: '/provider' })
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
router.delete('/:id', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
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

    await query('DELETE FROM bookings WHERE id = ?', [req.params.id])

    // Deleting removes the booking outright (unlike /cancel), but the
    // customer still needs to know their ride is off — reuses the same
    // cancellation email/wording, worded as an admin action since that's
    // what deletion always is.
    const emailDetails = {
      vehicleName: booking.vehicle_name || 'Unassigned',
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      date: booking.date,
      time: booking.time,
    }
    const recipientEmail = booking.passenger_email || booking.customer_email
    const recipientName = booking.passenger_name || booking.customer_name

    if (recipientEmail) {
      sendMail({
        to: recipientEmail,
        subject: 'Booking cancelled — BlackStone Chauffeur',
        html: bookingCancelledTemplate({
          recipientName,
          greetingContext: 'Your booking has been cancelled by BlackStone Chauffeur. Get in touch if this is unexpected.',
          ...emailDetails,
        }),
      }).catch((err) => console.error('Failed to send cancellation email to customer (deleted booking)', err))
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
      }).catch((err) => console.error('Failed to send cancellation email to driver (deleted booking)', err))
    }

    res.json({ message: 'Booking deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete booking' })
  }
})

// PATCH /api/bookings/:id — admin/second_admin, edit most fields on an
// existing booking (contact info, trip details, vehicle, passenger/luggage
// counts, notes, reference, provider attribution/price, and — unlike
// everywhere else in this file — total_price itself). Every field is
// optional and only whatever keys are present in the request body get
// updated, so the client can send just the one field the admin changed.
// Still deliberately does not touch driver_id (see /assign-driver),
// booking_status (see /cancel and the driver-only /status route),
// payment_status (see /payment-status), or the Stripe fields — those all
// have their own dedicated, more careful routes. customer_id is now the one
// exception (see `provider_id` below) — everything else about "who this
// booking belongs to" still goes through those dedicated routes.
router.patch('/:id', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    const { rows: existingRows } = await query('SELECT id FROM bookings WHERE id = ?', [req.params.id])
    if (!existingRows.length) return res.status(404).json({ message: 'Booking not found' })

    const body = req.body || {}
    const sets = []
    const params = []
    const set = (col, val) => {
      sets.push(`${col} = ?`)
      params.push(val)
    }

    if ('passenger_name' in body) {
      const name = String(body.passenger_name || '').trim()
      if (!name) return res.status(400).json({ message: 'Passenger name cannot be empty' })
      set('passenger_name', name)
    }
    if ('passenger_phone' in body) set('passenger_phone', body.passenger_phone ? String(body.passenger_phone).trim() : null)
    if ('passenger_email' in body) set('passenger_email', body.passenger_email ? String(body.passenger_email).trim() : null)

    if ('pickup' in body) {
      const pickup = String(body.pickup || '').trim()
      if (!pickup) return res.status(400).json({ message: 'Pickup cannot be empty' })
      set('pickup', pickup)
    }
    if ('dropoff' in body) set('dropoff', String(body.dropoff || '').trim() || null)
    if ('date' in body) {
      if (!body.date) return res.status(400).json({ message: 'Date cannot be empty' })
      set('date', body.date)
    }
    if ('time' in body) {
      if (!body.time) return res.status(400).json({ message: 'Time cannot be empty' })
      set('time', body.time)
    }
    if ('trip_type' in body) {
      if (!['one_way', 'return', 'hourly'].includes(body.trip_type)) {
        return res.status(400).json({ message: 'Invalid trip type' })
      }
      set('trip_type', body.trip_type)
    }
    if ('service_type' in body) {
      set('service_type', body.service_type === 'Airport Transfer' ? 'Airport Transfer' : 'Chauffeur Service')
    }
    if ('hours' in body) {
      set('hours', body.hours !== '' && body.hours != null ? Math.max(0, Number(body.hours)) : null)
    }
    if ('flight_number' in body) set('flight_number', body.flight_number ? String(body.flight_number).trim() : null)
    if ('stop_addresses' in body) {
      const stopAddresses = Array.isArray(body.stop_addresses)
        ? body.stop_addresses.map((a) => String(a || '').trim()).filter(Boolean)
        : []
      set('stop_addresses', stopAddresses.length ? JSON.stringify(stopAddresses) : null)
      set('stops', stopAddresses.length)
    }
    if ('passengers' in body) set('passengers', Math.min(20, Math.max(1, Number(body.passengers) || 1)))
    if ('suitcases' in body) set('suitcases', Math.min(20, Math.max(0, Number(body.suitcases) || 0)))
    if ('child_seats' in body) set('child_seats', Math.min(CHILD_SEAT_MAX, Math.max(0, Number(body.child_seats) || 0)))
    if ('notes' in body) set('notes', String(body.notes || '').trim().slice(0, 250) || null)
    if ('reference' in body) set('reference', String(body.reference || '').trim().slice(0, 100) || null)

    if ('vehicle_id' in body) {
      const { rows: vehicleRows } = await query('SELECT id FROM vehicles WHERE id = ? AND active = true', [body.vehicle_id])
      if (!vehicleRows.length) return res.status(400).json({ message: 'Invalid vehicle selected' })
      set('vehicle_id', body.vehicle_id)
    }

    // provider_price mirrors driver_price — a rate admin sets for this
    // booking, separate from total_price, that counts toward the owning
    // provider's monthly settlement. Send '' or null to clear it back out.
    if ('provider_price' in body) {
      const price = body.provider_price === '' || body.provider_price == null ? null : Number(body.provider_price)
      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        return res.status(400).json({ message: 'Provider price must be a valid non-negative number' })
      }
      set('provider_price', price !== null ? Math.round(price * 100) / 100 : null)
    }

    // provider_id re-attributes an existing booking to a provider's account
    // (or clears it back to whoever's editing it now) — the same mechanism
    // POST /provider uses at creation time, just applied after the fact
    // (e.g. admin realises a WhatsApp booking was actually placed on behalf
    // of a specific provider). Guarded against ever touching a booking a
    // real customer placed themselves — re-attributing that would silently
    // vanish it from their own dashboard.
    let notifyNewProviderId = null
    if ('provider_id' in body) {
      const { rows: ownerRows } = await query(
        `SELECT u.role FROM bookings b LEFT JOIN users u ON u.id = b.customer_id WHERE b.id = ?`,
        [req.params.id],
      )
      if (ownerRows[0]?.role === 'customer') {
        return res.status(400).json({ message: "This booking was placed directly by a customer and can't be attributed to a provider." })
      }
      if (body.provider_id) {
        const { rows: providerRows } = await query(
          `SELECT id FROM users WHERE id = ? AND role = 'provider' AND status = 'active'`,
          [body.provider_id],
        )
        if (!providerRows.length) return res.status(400).json({ message: 'Invalid provider selected' })
        set('customer_id', providerRows[0].id)
        notifyNewProviderId = providerRows[0].id
      } else {
        set('customer_id', req.user.id)
      }
    }

    // Unlike every other route in this file, an admin editing an existing
    // booking IS trusted to override the price directly — this is the same
    // deliberate exception used by POST /provider, just applied after the
    // fact (e.g. a phone-negotiated rate change, or fixing a typo).
    if ('total_price' in body) {
      const price = Number(body.total_price)
      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ message: 'A valid total price is required' })
      }
      set('total_price', Math.round(price * 100) / 100)
    }

    if (!sets.length) return res.status(400).json({ message: 'No fields to update' })

    params.push(req.params.id)
    await query(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`, params)

    const { rows } = await query(
      `SELECT b.*, v.name AS vehicle_name, u.name AS customer_name, u.email AS customer_email, u.role AS customer_role
       FROM bookings b
       LEFT JOIN vehicles v ON v.id = b.vehicle_id
       LEFT JOIN users u ON u.id = b.customer_id
       WHERE b.id = ?`,
      [req.params.id],
    )
    const booking = rows[0]

    // Notify whoever's actually riding — the booking's own contact email if
    // one was given (this is what the passenger typed on the booking form,
    // which matters for provider bookings where the account owner is the
    // travel agent, not the passenger), falling back to the account holder.
    const recipientEmail = booking.passenger_email || booking.customer_email
    if (recipientEmail) {
      sendMail({
        to: recipientEmail,
        subject: 'Your booking has been updated — BlackStone Chauffeur',
        html: bookingUpdatedTemplate({
          customerName: booking.passenger_name || booking.customer_name,
          pickup: booking.pickup,
          dropoff: booking.dropoff,
          date: booking.date,
          time: booking.time,
          totalPrice: booking.total_price,
        }),
      }).catch((err) => console.error('Failed to send booking-updated email', err))
    }

    // Other admins get a heads-up too (not the one who just made the edit —
    // they already know), and the provider it's attributed to (if any)
    // hears about it whether or not this particular edit changed who it's
    // attributed to.
    notifyAdmins(
      {
        type: 'booking_updated',
        title: 'Booking Updated',
        message: `#${booking.id} — ${booking.passenger_name || booking.customer_name}, ${booking.date}`,
        link: '/admin',
      },
      req.user.id,
    )
    const providerToNotify = notifyNewProviderId || (booking.customer_role === 'provider' ? booking.customer_id : null)
    if (providerToNotify) {
      notify(providerToNotify, {
        type: 'booking_updated',
        title: 'Your Booking Was Updated',
        message: `#${booking.id} — ${booking.passenger_name || booking.customer_name}, ${booking.date}`,
        link: '/provider',
      })
    }

    res.json(booking)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update booking' })
  }
})

// PATCH /api/bookings/:id/assign-driver — admin/second_admin
router.patch(
  '/:id/assign-driver',
  authCheck,
  requirePermission('can_manage_bookings'),
  async (req, res) => {
    const { driverId, driverPrice } = req.body || {}
    // driverPrice is optional and, if present, has to be a valid
    // non-negative number — separate from and never derived from
    // total_price. Omit it entirely to leave whatever's already stored
    // untouched (e.g. re-assigning a driver without changing their pay).
    let priceUpdateClause = ''
    const params = [driverId]
    if (driverPrice !== undefined) {
      const price = driverPrice === '' || driverPrice === null ? null : Number(driverPrice)
      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        return res.status(400).json({ message: 'Driver price must be a valid non-negative number' })
      }
      priceUpdateClause = ', driver_price = ?'
      params.push(price === null ? null : Math.round(price * 100) / 100)
    }
    try {
      // Captured before the UPDATE overwrites driver_id — this is the only
      // way to know who's being taken off the ride. If it's a different
      // person than the new driverId (including being unassigned outright),
      // they get a gentle "no longer on your schedule" notice below rather
      // than being left to notice the ride vanished from their dashboard.
      const { rows: previousRows } = await query(
        `SELECT b.driver_id AS previous_driver_id, b.pickup, b.dropoff, b.date, b.time,
                u.name AS previous_driver_name, u.email AS previous_driver_email
         FROM bookings b
         LEFT JOIN users u ON u.id = b.driver_id
         WHERE b.id = ?`,
        [req.params.id],
      )
      if (!previousRows.length) return res.status(404).json({ message: 'Booking not found' })
      const previous = previousRows[0]

      await query(`UPDATE bookings SET driver_id = ?${priceUpdateClause} WHERE id = ?`, [...params, req.params.id])
      const { rows } = await query(
        `SELECT b.*, u.name AS driver_name, u.email AS driver_email, c.role AS customer_role
         FROM bookings b
         LEFT JOIN users u ON u.id = b.driver_id
         LEFT JOIN users c ON c.id = b.customer_id
         WHERE b.id = ?`,
        [req.params.id],
      )
      if (!rows.length) return res.status(404).json({ message: 'Booking not found' })

      const booking = rows[0]
      const tripSummary = `${booking.date} at ${String(booking.time).slice(0, 5)} — ${booking.pickup} → ${booking.dropoff || 'Hourly'}`

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
      if (booking.driver_id) {
        notify(booking.driver_id, { type: 'driver_assigned', title: 'New Ride Assigned', message: tripSummary, link: '/driver' })
      }
      if (booking.customer_role === 'provider') {
        notify(booking.customer_id, {
          type: 'driver_assigned',
          title: 'Driver Assigned to Your Booking',
          message: tripSummary,
          link: '/provider',
        })
      }

      const wasReassignedAway =
        previous.previous_driver_id && previous.previous_driver_id !== booking.driver_id
      if (wasReassignedAway && previous.previous_driver_email) {
        sendMail({
          to: previous.previous_driver_email,
          subject: 'Schedule update — BlackStone Chauffeur',
          html: driverReassignedTemplate({
            driverName: previous.previous_driver_name,
            pickup: previous.pickup,
            dropoff: previous.dropoff,
            date: previous.date,
            time: previous.time,
          }),
        }).catch((err) => console.error('Failed to send driver-reassigned email', err))
      }
      if (wasReassignedAway && previous.previous_driver_id) {
        notify(previous.previous_driver_id, {
          type: 'driver_removed',
          title: 'Schedule Update',
          message: `You're no longer on this ride: ${previous.date} — ${previous.pickup} → ${previous.dropoff || 'Hourly'}`,
          link: '/driver',
        })
      }

      res.json(rows[0])
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Failed to assign driver' })
    }
  },
)

// PATCH /api/bookings/:id/payment-status — admin/second_admin, manually set
// a booking's payment_status. Customer bookings normally only reach 'paid'
// automatically via POST /confirm (which re-checks the real Stripe
// PaymentIntent before writing it) — this route is for the cases nothing
// automatic covers: provider/admin-placed bookings (invoiced outside the
// system, so payment_status starts and stays 'pending' until someone here
// marks it paid), correcting a mistake, or recording a refund/failure.
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded']
router.patch('/:id/payment-status', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  const { status } = req.body || {}
  if (!PAYMENT_STATUS_OPTIONS.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${PAYMENT_STATUS_OPTIONS.join(', ')}` })
  }
  try {
    const { rows: existingRows } = await query('SELECT id FROM bookings WHERE id = ?', [req.params.id])
    if (!existingRows.length) return res.status(404).json({ message: 'Booking not found' })

    await query('UPDATE bookings SET payment_status = ? WHERE id = ?', [status, req.params.id])
    const { rows } = await query('SELECT * FROM bookings WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update payment status' })
  }
})

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
router.get('/drivers', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
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

// GET /api/bookings/providers — admin/second_admin, active provider
// accounts for the New Booking form's "Attribute to provider" dropdown.
router.get('/providers', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name FROM users WHERE role = 'provider' AND status = 'active' ORDER BY name`,
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load providers' })
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
