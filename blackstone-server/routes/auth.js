import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { sendMail } from '../emails/mailer.js'
import { driverPendingTemplate } from '../emails/templates/driverPending.js'

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

// POST /api/auth/login
router.post('/login', async (req, res) => {
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

export default router
