import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requirePermission } from '../middleware/requirePermission.js'

const router = Router()

// Every column PATCH /:id is allowed to touch. This exists specifically so
// that route can build its SET clause from a fixed, known-safe list instead
// of trusting whatever keys happen to be present on the request body — see
// the comment on that route for why that distinction matters.
const EDITABLE_VEHICLE_COLUMNS = [
  'name', 'type', 'description', 'capacity', 'price_per_km', 'image_url',
  'passengers', 'suitcases', 'owned', 'starting_price', 'active',
  'price_per_minute', 'price_per_occupant', 'price_per_suitcase',
  'distance_tiers', 'features',
]

// GET /api/vehicles — public, no auth. Only ever returns active vehicles —
// a deactivated one (see DELETE below) must disappear from the public Select
// Vehicle list immediately, even though its row is kept forever so past
// bookings that reference it by id still resolve correctly.
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM vehicles WHERE active = true ORDER BY id')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load vehicles' })
  }
})

// POST /api/vehicles — admin, or second_admin with can_manage_vehicles.
// Unlike PATCH below, this one is naturally injection-safe without an
// explicit whitelist: every column is destructured by name up front, so an
// unrecognised key in the request body is simply never read, not dropped
// into the query string.
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

  // SECURITY: only ever build the SET clause from keys we recognise, never
  // from Object.keys(fields) directly — the request body's own keys are
  // attacker-controlled, and dropping them straight into a template-literal
  // SQL string would let anyone who can reach this route (any second_admin
  // scoped to can_manage_vehicles, not just a full admin) inject arbitrary
  // SQL via a crafted key name. Every other dynamic-SET route in this app
  // (routes/bookings.js, routes/permissions.js) already whitelists this way;
  // this route used to be the one exception.
  const keys = Object.keys(fields).filter((k) => EDITABLE_VEHICLE_COLUMNS.includes(k))
  if (!keys.length) return res.status(400).json({ message: 'No recognised fields to update' })

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

// DELETE /api/vehicles/:id — admin, or second_admin with can_manage_vehicles.
// A soft delete, not a real row deletion: bookings.vehicle_id is a foreign
// key into this table, so actually removing the row would either fail
// outright or orphan every past booking that used this vehicle. Flipping
// `active` to false is enough to hide it everywhere it should disappear
// from (GET / above, the public Select Vehicle screen) while every existing
// booking's vehicle reference — and its receipt/invoice history — stays intact.
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
