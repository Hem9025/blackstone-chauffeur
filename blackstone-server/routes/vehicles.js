import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requirePermission } from '../middleware/requirePermission.js'

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

// POST /api/vehicles — admin, or second_admin with can_manage_vehicles
router.post('/', authCheck, requirePermission('can_manage_vehicles'), async (req, res) => {
  const {
    name, type, description, capacity, price_per_km, image_url,
    passengers, suitcases, owned, starting_price,
    price_per_minute, price_per_occupant, price_per_suitcase,
    distance_tiers, features,
  } = req.body || {}
  try {
    const inserted = await query(
      `INSERT INTO vehicles
        (name, type, description, capacity, price_per_km, image_url,
         passengers, suitcases, owned, starting_price,
         price_per_minute, price_per_occupant, price_per_suitcase,
         distance_tiers, features, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [
        name, type, description, capacity, price_per_km, image_url,
        passengers, suitcases, owned, starting_price,
        price_per_minute, price_per_occupant, price_per_suitcase,
        JSON.stringify(distance_tiers || []), JSON.stringify(features || []),
      ],
    )
    const { rows } = await query('SELECT * FROM vehicles WHERE id = ?', [inserted.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create vehicle' })
  }
})

// PATCH /api/vehicles/:id — admin, or second_admin with can_manage_vehicles
router.patch('/:id', authCheck, requirePermission('can_manage_vehicles'), async (req, res) => {
  const { id } = req.params
  const fields = req.body || {}
  const keys = Object.keys(fields)
  if (!keys.length) return res.status(400).json({ message: 'No fields to update' })

  const setClause = keys.map((k) => `${k} = ?`).join(', ')
  // distance_tiers/features are JSON columns — the admin panel sends them as
  // parsed arrays. mysql2 doesn't JSON-encode plain object/array params for
  // a `= ?` placeholder (arrays there are treated as bulk-insert value
  // lists), so without this they'd be mis-serialized and corrupt the stored
  // JSON. Stringify any object/array field before it becomes a query param.
  const values = keys.map((k) => {
    const v = fields[k]
    return v !== null && typeof v === 'object' ? JSON.stringify(v) : v
  })

  try {
    await query(`UPDATE vehicles SET ${setClause} WHERE id = ?`, [...values, id])
    const { rows } = await query('SELECT * FROM vehicles WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ message: 'Vehicle not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update vehicle' })
  }
})

// DELETE /api/vehicles/:id — admin, or second_admin with can_manage_vehicles; soft delete
router.delete('/:id', authCheck, requirePermission('can_manage_vehicles'), async (req, res) => {
  try {
    const { rows } = await query('SELECT id FROM vehicles WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Vehicle not found' })
    await query('UPDATE vehicles SET active = false WHERE id = ?', [req.params.id])
    res.json({ message: 'Vehicle deactivated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete vehicle' })
  }
})

export default router
