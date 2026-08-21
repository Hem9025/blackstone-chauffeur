import { Router } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { sendMail } from '../emails/mailer.js'
import { driverPendingTemplate } from '../emails/templates/driverPending.js'
import { passwordResetTemplate } from '../emails/templates/passwordReset.js'
import { loginLimiter, forgotPasswordLimiter } from '../middleware/rateLimit.js'

const router = Router()

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  )
}

// Public self-registration only ever creates a customer or a (pending)
// driver — provider/admin/second_admin accounts must be created by an admin
// via POST /api/admin/users, which is authenticated and role-gated. Without
// this allowlist, a request straight to this endpoint (bypassing the
// register form, which always sends role: 'customer') could hand out any
// role — including 'admin' — with an active status and a signed token.
const SELF_REGISTER_ROLES = ['customer', 'driver']

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, role } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' })
  }

  const resolvedRole = SELF_REGISTER_ROLES.includes(role) ? role : 'customer'

  try {
    const existing = await query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const status = resolvedRole === 'driver' ? 'pending' : 'active'

    const inserted = await query(
      `INSERT INTO users (name, email, password_hash, phone, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, passwordHash, phone, resolvedRole, status],
    )
    const { rows } = await query(
      'SELECT id, name, email, phone, role, status FROM users WHERE id = ?',
      [inserted.insertId],
    )

    const user = rows[0]
    const token = signToken(user)

    if (resolvedRole === 'driver') {
      sendMail({
        to: email,
        subject: 'Application received — BlackStone Chauffeur',
        html: driverPendingTemplate({ name }),
      }).catch((err) => console.error('Failed to send driver-pending email', err))
    }

    res.status(201).json({ token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Registration failed' })
  }
})

// POST /api/auth/login — rate-limited (see middleware/rateLimit.js): this
// route had no protection at all against repeated password guessing against
// a known email before this.
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' })
  }

  try {
    const { rows } = await query('SELECT * FROM users WHERE email = ?', [email])
    const user = rows[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // 'inactive' = admin has deactivated this account (see PATCH
    // /admin/users/:id/status) without deleting it or its booking history —
    // rejected here rather than just in the client, so a deactivated user
    // can't call the API directly with a still-valid password. 'pending'
    // (driver awaiting approval) still logs in — the client sends them to a
    // waiting page instead of blocking here, since that's an expected,
    // temporary state rather than a lockout.
    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'This account has been deactivated. Contact an admin for access.' })
    }

    const token = signToken(user)
    const { password_hash, ...safeUser } = user

    res.json({ token, user: safeUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Login failed' })
  }
})

// GET /api/auth/me
router.get('/me', authCheck, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?',
      [req.user.id],
    )
    if (!rows.length) return res.status(404).json({ message: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load user' })
  }
})

// PATCH /api/auth/me — update your own profile (name, phone only; email and
// role are intentionally not editable here).
router.patch('/me', authCheck, async (req, res) => {
  const { name, phone } = req.body || {}
  if (!name) {
    return res.status(400).json({ message: 'name is required' })
  }

  try {
    await query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone || null, req.user.id])
    const { rows } = await query(
      'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?',
      [req.user.id],
    )
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

// PATCH /api/auth/password — change your own password
router.patch('/password', authCheck, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword and newPassword are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' })
  }

  try {
    const { rows } = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id])
    if (!rows.length) return res.status(404).json({ message: 'User not found' })

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash)
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' })

    const newHash = await bcrypt.hash(newPassword, 10)
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id])

    res.json({ message: 'Password updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update password' })
  }
})

// POST /api/auth/forgot-password — always responds with the same generic
// message whether or not the email is registered, so this can't be used to
// probe which emails have an account. If it *is* registered, fires off a
// reset email with a one-hour-lived token (fire-and-forget, like every
// other transactional email in this app — a slow/failed send shouldn't
// hold up or fail the request).
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body || {}
  if (!email) {
    return res.status(400).json({ message: 'email is required' })
  }

  const genericMessage = { message: "If that email is registered, we've sent a password reset link." }

  try {
    const { rows } = await query('SELECT id, name, email FROM users WHERE email = ?', [email])
    if (!rows.length) {
      return res.json(genericMessage)
    }
    const user = rows[0]

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, user.id])

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`
    sendMail({
      to: user.email,
      subject: 'Reset your password — BlackStone Chauffeur',
      html: passwordResetTemplate({ name: user.name, resetUrl }),
    }).catch((err) => console.error('Failed to send password-reset email', err))

    res.json(genericMessage)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to process request' })
  }
})

// POST /api/auth/reset-password — completes the reset started above. Token
// is single-use (cleared as soon as it's redeemed) and time-limited
// (checked against reset_token_expires in the same query, so an expired
// token behaves identically to an invalid one).
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {}
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'token and newPassword are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' })
  }

  try {
    const { rows } = await query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token],
    )
    if (!rows.length) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [newHash, rows[0].id],
    )

    res.json({ message: 'Password reset — you can now log in with your new password.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to reset password' })
  }
})

export default router
