import jwt from 'jsonwebtoken'

/**
 * Verifies the JWT in the Authorization header and attaches the decoded
 * payload to req.user. Responds 401 if missing/invalid.
 */
export default function authCheck(req, res, next) {
  const header = req.headers.authorization
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload // { id, role, email, ... }
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
