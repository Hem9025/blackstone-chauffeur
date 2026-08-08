import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import vehicleRoutes from './routes/vehicles.js'
import bookingRoutes from './routes/bookings.js'
import enquiryRoutes from './routes/enquiries.js'
import adminRoutes from './routes/admin.js'
import reviewRoutes from './routes/reviews.js'
import stripeWebhookRoutes from './routes/stripeWebhook.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5050

// Accepts CLIENT_URL from the environment plus every known real domain
// variant (www vs non-www, http vs https) and localhost for dev — a single
// fixed origin was silently rejecting requests from whichever variant
// wasn't the exact configured one, which is the most likely cause of the
// intermittent "failed to fetch" errors reported on the live site (a
// request from a mismatched origin fails at the browser level with no
// useful error, so it looks random from the user's side).
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'https://blackstonechauffeur.co.nz',
  'https://www.blackstonechauffeur.co.nz',
  'http://blackstonechauffeur.co.nz',
  'http://www.blackstonechauffeur.co.nz',
  'http://localhost:5173',
].filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header (curl, health checks, server-to-server) — allow.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
      console.warn(`[cors] Rejected request from unrecognised origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    },
  }),
)

// Stripe webhook needs the raw body — must be mounted BEFORE express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRoutes)

app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/enquiries', enquiryRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reviews', reviewRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`BlackStone Chauffeur API running on port ${PORT}`)
})
