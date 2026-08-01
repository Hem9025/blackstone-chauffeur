import bcrypt from 'bcryptjs'
import { query, closeDb } from './index.js'

// Demo accounts for local/dev testing. Change or remove these before going
// live — they use simple, publicly-documented passwords on purpose.
const DEMO_USERS = [
  {
    name: 'Demo Admin',
    email: 'admin@demo.com',
    password: 'Password123!',
    phone: '+64 21 000 0001',
    role: 'admin',
  },
  {
    name: 'Demo Provider',
    email: 'provider@demo.com',
    password: 'Password123!',
    phone: '+64 21 000 0002',
    role: 'provider',
  },
  {
    name: 'Demo Customer',
    email: 'customer@demo.com',
    password: 'Password123!',
    phone: '+64 21 000 0003',
    role: 'customer',
  },
  {
    name: 'Demo Driver',
    email: 'driver@demo.com',
    password: 'Password123!',
    phone: '+64 21 000 0004',
    role: 'driver',
    status: 'active', // active (not pending) so it can log straight in for testing
  },
]

// Distance-tier tables from the client's live pricing — flat fare for the
// bracket the trip's total distance falls into, not a per-km multiplier.
// Format matches vehicles.distance_tiers: [{ min, max, price }, ...]
function tiers(pairs) {
  // pairs: [[minKm, price], [minKm, price], ...] — max is inferred from the
  // next entry's min (minus 1); the last entry has no max (open-ended).
  return pairs.map(([min, price], i) => ({
    min,
    max: i < pairs.length - 1 ? pairs[i + 1][0] - 1 : null,
    price,
  }))
}

const ECONOMY_SUV_TIERS = tiers([
  [0, 105], [16, 125], [31, 150], [41, 170], [51, 195], [61, 214.99], [71, 235],
  [81, 260], [91, 280], [101, 300], [111, 330], [121, 350], [131, 380], [141, 400],
  [151, 420], [161, 440], [171, 480], [181, 510], [191, 530], [201, 550], [211, 570],
  [222, 0],
])

const BUSINESS_VAN_TIERS = tiers([
  [0, 125], [16, 145], [31, 170], [41, 200], [51, 230], [61, 260], [71, 290],
  [81, 325], [91, 350], [101, 380], [111, 410], [121, 440], [131, 470], [141, 500],
  [151, 530], [161, 560], [171, 590], [181, 620], [191, 650], [201, 680], [211, 710],
  [223, 0],
])

const ECONOMY_SEDAN_TIERS = tiers([
  [0, 100], [16, 120], [31, 140], [41, 160], [51, 180], [61, 200], [71, 220],
  [81, 240], [91, 260], [101, 280], [111, 300], [121, 320], [131, 350], [141, 375],
  [151, 390], [161, 415], [171, 435], [181, 460], [191, 490], [201, 520], [211, 550],
  [222, 0],
])

const ECONOMY_VAN_TIERS = tiers([
  [0, 110], [16, 135], [31, 160], [41, 185], [51, 210], [61, 230], [71, 250],
  [81, 280], [91, 300], [101, 330], [111, 360], [121, 385], [131, 410], [141, 435],
  [151, 460], [161, 485], [171, 510], [181, 540], [191, 570], [201, 600], [211, 630],
  [221, 0],
])

// Matches the client's live admin data exactly (Business Sedan's table is
// identical to Economy Van's in their current pricing setup).
const BUSINESS_SEDAN_TIERS = ECONOMY_VAN_TIERS

const DEMO_VEHICLES = [
  {
    name: 'Economy SUV',
    type: 'economy',
    description: 'Comfortable SUV for airport transfers and small groups.',
    capacity: 3,
    passengers: 3,
    suitcases: 3,
    owned: 1,
    starting_price: 0,
    price_per_minute: 0,
    price_per_occupant: 0,
    price_per_suitcase: 0,
    distance_tiers: ECONOMY_SUV_TIERS,
    features: ['Free Wifi', 'Meet & Greet'],
    image_url: 'https://images.unsplash.com/photo-1673166105764-a6aa7e0e73a7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Business Van',
    type: 'business',
    description: 'Executive-configured van for small groups who expect first-class service.',
    capacity: 6,
    passengers: 6,
    suitcases: 4,
    owned: 1,
    starting_price: 0,
    price_per_minute: 0,
    price_per_occupant: 0,
    price_per_suitcase: 0,
    distance_tiers: BUSINESS_VAN_TIERS,
    features: ['Chocolates / Mint', 'Free Wifi', 'Meet & Greet', 'Phone Charger', 'Water Bottle'],
    image_url: 'https://images.unsplash.com/photo-1775637483812-fee34cccf8d7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Economy Sedan',
    type: 'economy',
    description: 'Reliable, comfortable sedan for everyday chauffeur travel.',
    capacity: 3,
    passengers: 3,
    suitcases: 2,
    owned: 1,
    starting_price: 0,
    price_per_minute: 0,
    price_per_occupant: 0,
    price_per_suitcase: 0,
    distance_tiers: ECONOMY_SEDAN_TIERS,
    features: ['Free Wifi', 'Meet & Greet'],
    image_url: 'https://images.unsplash.com/photo-1609521233053-345bfa8b6f17?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Economy Van',
    type: 'economy',
    description: 'Spacious van, ideal for groups and airport runs with extra luggage.',
    capacity: 5,
    passengers: 5,
    suitcases: 5,
    owned: 1,
    starting_price: 0,
    price_per_minute: 0,
    price_per_occupant: 0,
    price_per_suitcase: 0,
    distance_tiers: ECONOMY_VAN_TIERS,
    features: ['Free Wifi', 'Meet & Greet'],
    image_url: 'https://images.unsplash.com/photo-1710343491609-0cbc6c14b92d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Business Sedan',
    type: 'business',
    description: 'Executive sedan with premium extras for corporate and VIP travel.',
    capacity: 2,
    passengers: 2,
    suitcases: 2,
    owned: 1,
    starting_price: 0,
    price_per_minute: 0,
    price_per_occupant: 0,
    price_per_suitcase: 0,
    distance_tiers: BUSINESS_SEDAN_TIERS,
    features: ['Chocolates / Mint', 'Free Wifi', 'Meet & Greet', 'Phone Charger', 'Water Bottle'],
    image_url: 'https://images.unsplash.com/photo-1655827763440-7905302b75ff?auto=format&fit=crop&w=1200&q=80',
  },
]

// Older seed runs created these — deactivate them (soft delete, like the
// admin "remove vehicle" action) so they stop appearing in Select Vehicle,
// without breaking any past booking that references them by id.
const RETIRED_VEHICLE_NAMES = ['Mercedes-Benz S-Class', 'Cadillac Escalade']

async function retireLegacyVehicles(q) {
  for (const name of RETIRED_VEHICLE_NAMES) {
    await q('UPDATE vehicles SET active = false WHERE name = ? AND active = true', [name])
  }
}

async function upsertUser(q, user) {
  const passwordHash = await bcrypt.hash(user.password, 10)
  const status = user.status || 'active'

  // MySQL has no RETURNING clause — upsert, then look the row back up by
  // its unique email.
  await q(
    `INSERT INTO users (name, email, password_hash, phone, role, status)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       name = VALUES(name),
       phone = VALUES(phone),
       role = VALUES(role),
       status = VALUES(status)`,
    [user.name, user.email, passwordHash, user.phone, user.role, status],
  )

  const { rows } = await q('SELECT id, name, email, role, status FROM users WHERE email = ?', [user.email])
  return rows[0]
}

async function upsertVehicle(q, vehicle) {
  const existing = await q('SELECT id FROM vehicles WHERE name = ?', [vehicle.name])

  // Bootstrap-only: once a vehicle with this name exists, leave it alone.
  // The Admin > Vehicles panel is the source of truth after initial setup —
  // re-running seed (which happens automatically on every server start)
  // must never overwrite an admin's edits back to these hardcoded values.
  if (existing.rows.length) {
    return { id: existing.rows[0].id, name: vehicle.name, skipped: true }
  }

  const columns = [
    'name', 'type', 'description', 'capacity', 'passengers', 'suitcases', 'owned',
    'starting_price', 'price_per_minute', 'price_per_occupant', 'price_per_suitcase',
    'distance_tiers', 'features', 'image_url',
  ]
  const values = [
    vehicle.name, vehicle.type, vehicle.description, vehicle.capacity, vehicle.passengers,
    vehicle.suitcases, vehicle.owned, vehicle.starting_price, vehicle.price_per_minute,
    vehicle.price_per_occupant, vehicle.price_per_suitcase,
    JSON.stringify(vehicle.distance_tiers || []), JSON.stringify(vehicle.features || []),
    vehicle.image_url,
  ]

  const placeholders = columns.map(() => '?').join(', ')
  const result = await q(
    `INSERT INTO vehicles (${columns.join(', ')}, active) VALUES (${placeholders}, true)`,
    values,
  )
  return { id: result.insertId, name: vehicle.name }
}

// queryFn lets callers bypass the public `query()` export — used by
// db/index.js when auto-seeding on first connection, since at that point
// it's already inside the readiness gate that `query()` itself waits on
// (calling back through `query()` there would deadlock).
export async function runSeed({ silent = false, queryFn } = {}) {
  const q = queryFn || query
  const log = silent ? () => {} : console.log

  log('Seeding demo users...')
  for (const user of DEMO_USERS) {
    const result = await upsertUser(q, user)
    log(`  ✓ ${result.role.padEnd(10)} ${result.email}`)
  }

  log('Seeding demo vehicles...')
  for (const vehicle of DEMO_VEHICLES) {
    const result = await upsertVehicle(q, vehicle)
    log(`  ✓ ${result.name}${result.skipped ? ' (already exists — left as-is)' : ' (created)'}`)
  }

  await retireLegacyVehicles(q)

  log('\nDone. Demo login password for all accounts: Password123!')
}

// CLI entry point: `npm run seed` — runs once and exits. This also runs
// automatically on server start (see db/index.js), so running it manually
// is mainly useful for re-seeding a database on demand (e.g. after
// importing schema.sql into hPanel by hand).
const isMain = process.argv[1] && process.argv[1].endsWith('seed.js')
if (isMain) {
  runSeed()
    .then(() => closeDb())
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
