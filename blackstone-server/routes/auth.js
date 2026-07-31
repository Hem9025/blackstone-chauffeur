import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'

const router = Router()

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  )
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, role = 'customer' } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' })
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const status = role === 'driver' ? 'pending' : 'active'

    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, role, status`,
      [name, email, passwordHash, phone, role, status],
    )

    const user = rows[0]
    const token = signToken(user)

    // TODO: send driver-pending / welcome email via emails/mailer.js

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
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email])
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
      'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = $1',
      [req.user.id],
    )
    if (!rows.length) return res.status(404).json({ message: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load user' })
  }
})

export default router
