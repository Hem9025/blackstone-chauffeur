import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'

const router = Router()

// GET /api/push/public-key — the client needs this to create a subscription.
router.get('/public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null })
})

// POST /api/push/subscribe — saves this device for the logged-in user. If the
// same device was previously used by another account, it moves to this one.
router.post('/subscribe', authCheck, async (req, res) => {
  const { endpoint, keys } = req.body || {}
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ message: 'Invalid subscription' })
  }
  try {
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth)`,
      [req.user.id, endpoint, keys.p256dh, keys.auth],
    )
    res.json({ message: 'Subscribed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to save subscription' })
  }
})

// POST /api/push/unsubscribe
router.post('/unsubscribe', authCheck, async (req, res) => {
  const { endpoint } = req.body || {}
  if (!endpoint) return res.status(400).json({ message: 'endpoint required' })
  try {
    await query('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?', [endpoint, req.user.id])
    res.json({ message: 'Unsubscribed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to unsubscribe' })
  }
})

// POST /api/push/device — the phone app registers its Firebase token for the
// logged-in user (moves to this user if the phone was used by someone else).
router.post('/device', authCheck, async (req, res) => {
  const { token, platform } = req.body || {}
  if (!token || typeof token !== 'string') return res.status(400).json({ message: 'token required' })
  try {
    await query(
      `INSERT INTO device_tokens (user_id, token, platform) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), platform = VALUES(platform)`,
      [req.user.id, token.slice(0, 500), platform === 'ios' ? 'ios' : 'android'],
    )
    res.json({ message: 'Registered' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to register device' })
  }
})

// POST /api/push/device/remove — on log out, stop pushing to this phone.
router.post('/device/remove', authCheck, async (req, res) => {
  const { token } = req.body || {}
  if (!token) return res.status(400).json({ message: 'token required' })
  try {
    await query('DELETE FROM device_tokens WHERE token = ? AND user_id = ?', [token, req.user.id])
    res.json({ message: 'Removed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to remove device' })
  }
})

export default router
