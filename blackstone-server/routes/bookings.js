import { Router } from 'express'
import Stripe from 'stripe'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// POST /api/bookings — customer, create booking + Stripe PaymentIntent
router.post('/', authCheck, requireRole('customer'), async (req, res) => {
  const { vehicle_id, pickup, dropoff, date, time, extras, total_price } = req.body || {}

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(total_price) * 100),
      currency: 'nzd',
      metadata: { customer_id: String(req.user.id) },
    })

    const { rows } = await query(
      `INSERT INTO bookings
        (customer_id, vehicle_id, pickup, dropoff, date, time, extras, total_price,
         payment_status, booking_status, stripe_payment_intent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'pending', $9)
       RETURNING *`,
      [
        req.user.id,
        vehicle_id,
        pickup,
        dropoff,
        date,
        time,
        JSON.stringify(extras || []),
        total_price,
        paymentIntent.id,
      ],
    )

    res.status(201).json({ booking: rows[0], client_secret: paymentIntent.client_secret })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create booking' })
  }
})

// POST /api/bookings/confirm — mark paid + send confirmation emails
router.post('/confirm', authCheck, async (req, res) => {
  const { booking_id } = req.body || {}
  try {
    const { rows } = await query(
      `UPDATE bookings SET payment_status = 'paid' WHERE id = $1 RETURNING *`,
      [booking_id],
    )
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' })

    // TODO: send booking-confirmation email to customer via emails/mailer.js

    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to confirm booking' })
  }
})

// GET /api/bookings/my — customer, own bookings
router.get('/my', authCheck, requireRole('customer'), async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM bookings WHERE customer_id = $1 ORDER BY created_at DESC',
      [req.user.id],
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load bookings' })
  }
})

// GET /api/bookings/all — admin/second_admin, with optional filters
router.get('/all', authCheck, requireRole('admin', 'second_admin'), async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM bookings ORDER BY created_at DESC')
    res.json(rows) // TODO: apply req.query filters (status, date range, driver, etc.)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load bookings' })
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
      const { rows } = await query(
        'UPDATE bookings SET driver_id = $1 WHERE id = $2 RETURNING *',
        [driverId, req.params.id],
      )
      if (!rows.length) return res.status(404).json({ message: 'Booking not found' })

      // TODO: send booking-assigned email to driver via emails/mailer.js

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
    const { rows } = await query(
      'UPDATE bookings SET booking_status = $1 WHERE id = $2 AND driver_id = $3 RETURNING *',
      [status, req.params.id, req.user.id],
    )
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' })
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
      'SELECT * FROM bookings WHERE driver_id = $1 ORDER BY date, time',
      [req.user.id],
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load assigned rides' })
  }
})

export default router
