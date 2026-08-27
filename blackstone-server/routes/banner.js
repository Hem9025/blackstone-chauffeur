import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requirePermission } from '../middleware/requirePermission.js'

const router = Router()

// GET /api/banner — public, no auth. Always returns a row (site_banner is
// seeded with id=1 by schema.sql) — the client's own job is to hide the
// banner when active is false or message is blank, rather than this route
// ever returning null/404.
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT message, link_url, link_label, active, updated_at FROM site_banner WHERE id = 1')
    res.json(rows[0] || { message: '', link_url: null, link_label: null, active: false, updated_at: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load banner' })
  }
})

// PATCH /api/banner — admin, or second_admin with can_manage_bookings (the
// same flag the Coupons admin section uses — this whole "marketing" area
// piggybacks on that permission rather than introducing a new one).
router.patch('/', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  const { message, link_url, link_label, active } = req.body || {}
  const sets = []
  const params = []

  if (message !== undefined) {
    sets.push('message = ?')
    params.push(String(message || '').trim().slice(0, 255))
  }
  if (link_url !== undefined) {
    sets.push('link_url = ?')
    params.push(link_url ? String(link_url).trim() : null)
  }
  if (link_label !== undefined) {
    sets.push('link_label = ?')
    params.push(link_label ? String(link_label).trim().slice(0, 100) : null)
  }
  if (active !== undefined) {
    sets.push('active = ?')
    params.push(Boolean(active))
  }
  if (!sets.length) return res.status(400).json({ message: 'No recognised fields to update' })

  try {
    await query(`UPDATE site_banner SET ${sets.join(', ')} WHERE id = 1`, params)
    const { rows } = await query('SELECT message, link_url, link_label, active, updated_at FROM site_banner WHERE id = 1')
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update banner' })
  }
})

export default router
