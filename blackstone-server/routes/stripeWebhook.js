import { Router } from 'express'
import Stripe from 'stripe'
import { query } from '../db/index.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// POST /api/stripe/webhook
// NOTE: this route must be mounted with express.raw({ type: 'application/json' })
// in server.js — Stripe needs the raw body to verify the signature.
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object
    try {
      await query(
        `UPDATE bookings SET payment_status = 'paid' WHERE stripe_payment_intent_id = ?`,
        [intent.id],
      )
      // TODO: trigger booking-confirmation + ride-receipt emails
    } catch (err) {
      console.error('Failed to update booking from webhook', err)
    }
  }

  res.json({ received: true })
})

export default router
