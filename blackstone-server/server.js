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

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))

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
