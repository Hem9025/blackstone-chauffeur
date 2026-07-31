import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'

const router = Router()

// GET /api/vehicles — public, active vehicles only
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM vehicles WHERE active = true ORDER BY id')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load vehicles' })
  }
})

// POST /api/vehicles — admin only
router.post('/', authCheck, requireRole('admin'), async (req, res) => {
  const { name, type, description, capacity, price_per_km, image_url } = req.body || {}
  try {
    const { rows } = await query(
      `INSERT INTO vehicles (name, type, description, capacity, price_per_km, image_url, active)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
      [name, type, description, capacity, price_per_km, image_url],
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create vehicle' })
  }
})

// PATCH /api/vehicles/:id — admin only
router.patch('/:id', authCheck, requireRole('admin'), async (req, res) => {
  const { id } = req.params
  const fields = req.body || {}
  const keys = Object.keys(fields)
  if (!keys.length) return res.status(400).json({ message: 'No fields to update' })

  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
  const values = keys.map((k) => fields[k])

  try {
    const { rows } = await query(
      `UPDATE vehicles SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id],
    )
    if (!rows.length) return res.status(404).json({ message: 'Vehicle not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update vehicle' })
  }
})

// DELETE /api/vehicles/:id — admin only, soft delete
router.delete('/:id', authCheck, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await query(
      'UPDATE vehicles SET active = false WHERE id = $1 RETURNING *',
      [req.params.id],
    )
    if (!rows.length) return res.status(404).json({ message: 'Vehicle not found' })
    res.json({ message: 'Vehicle deactivated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete vehicle' })
  }
})

export default router
