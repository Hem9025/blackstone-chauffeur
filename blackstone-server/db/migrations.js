// Idempotent column additions for databases that were created before a
// given column existed. MySQL (unlike Postgres) has no
// `ADD COLUMN IF NOT EXISTS`, so we check information_schema first.
// schema.sql already defines every column for a brand-new database — this
// only matters for a database that was set up before a column was added.

const COLUMN_ADDITIONS = [
  { table: 'bookings', column: 'passenger_name', definition: 'VARCHAR(255)' },
  { table: 'bookings', column: 'passenger_phone', definition: 'VARCHAR(50)' },
  { table: 'bookings', column: 'passenger_email', definition: 'VARCHAR(255)' },
  { table: 'bookings', column: 'service_type', definition: "VARCHAR(50) NOT NULL DEFAULT 'Chauffeur Service'" },
  { table: 'bookings', column: 'hours', definition: 'INT' },
  { table: 'bookings', column: 'trip_type', definition: "VARCHAR(20) NOT NULL DEFAULT 'one_way'" },
  { table: 'bookings', column: 'flight_number', definition: 'VARCHAR(20)' },
  { table: 'bookings', column: 'stops', definition: 'INT NOT NULL DEFAULT 0' },
  { table: 'bookings', column: 'stop_addresses', definition: 'JSON' },
  { table: 'bookings', column: 'notes', definition: 'VARCHAR(250)' },
  { table: 'bookings', column: 'child_seats', definition: 'INT NOT NULL DEFAULT 0' },
  { table: 'bookings', column: 'driver_price', definition: 'DECIMAL(10, 2)' },
  { table: 'users', column: 'reset_token', definition: 'VARCHAR(255)' },
  { table: 'users', column: 'reset_token_expires', definition: 'DATETIME' },
  { table: 'bookings', column: 'provider_price', definition: 'DECIMAL(10, 2)' },
  { table: 'bookings', column: 'reference', definition: 'VARCHAR(100)' },
]

// Loosens NOT NULL columns on a database that was already provisioned before
// they became optional, so provider/admin bookings can be created with these
// left blank and filled in later (see routes/bookings.js POST /provider and
// PATCH /:id). Unlike COLUMN_ADDITIONS, this doesn't need an existence check
// first — MODIFY COLUMN is naturally idempotent, so re-running it against a
// column that's already nullable is a harmless no-op.
const NULLABLE_COLUMNS = [
  { table: 'bookings', column: 'vehicle_id', definition: 'INT NULL' },
  { table: 'bookings', column: 'pickup', definition: 'TEXT NULL' },
  { table: 'bookings', column: 'dropoff', definition: 'TEXT NULL' },
  { table: 'bookings', column: 'date', definition: 'DATE NULL' },
  { table: 'bookings', column: 'time', definition: 'TIME NULL' },
]

// Widens the users.status CHECK constraint to allow 'inactive' (admin
// account deactivation — see routes/admin.js PATCH /users/:id/status) on a
// database that was provisioned before that value existed. schema.sql names
// this constraint explicitly (chk_users_status) for new databases, but an
// older database may still have MySQL's auto-generated name from before it
// was given one (e.g. users_chk_1) — so this looks up whatever check
// constraint currently covers the status column by inspecting its clause,
// rather than assuming a specific name, then drops and recreates it under
// the canonical name. Safe to re-run: once the clause already mentions
// 'inactive' there's nothing left to do.
async function ensureUserStatusAllowsInactive(rawQuery, databaseName) {
  try {
    const { rows: checks } = await rawQuery(
      `SELECT tc.CONSTRAINT_NAME AS name, cc.CHECK_CLAUSE AS clause
       FROM information_schema.TABLE_CONSTRAINTS tc
       JOIN information_schema.CHECK_CONSTRAINTS cc
         ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
       WHERE tc.TABLE_SCHEMA = ? AND tc.TABLE_NAME = 'users' AND tc.CONSTRAINT_TYPE = 'CHECK'`,
      [databaseName],
    )
    const statusChecks = checks.filter((c) => /status/i.test(c.clause) && /pending/i.test(c.clause))
    const alreadyAllowsInactive = statusChecks.some((c) => /inactive/i.test(c.clause))
    if (alreadyAllowsInactive || !statusChecks.length) return

    for (const { name } of statusChecks) {
      await rawQuery(`ALTER TABLE users DROP CHECK \`${name}\``)
    }
    await rawQuery(
      `ALTER TABLE users ADD CONSTRAINT chk_users_status CHECK (status IN ('pending', 'active', 'inactive'))`,
    )
    console.log(`[db] Migration: users.status now allows 'inactive'`)
  } catch (err) {
    // Non-fatal — worst case, deactivating a user still works at the
    // application layer but a stale CHECK constraint rejects the UPDATE
    // until this is investigated. Logged loudly rather than left silent.
    console.error('[db] Migration: failed to update users.status check constraint', err)
  }
}

export async function runMigrations(rawQuery, databaseName) {
  for (const { table, column, definition } of COLUMN_ADDITIONS) {
    const { rows } = await rawQuery(
      `SELECT COUNT(*) AS count FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
      [databaseName, table, column],
    )
    const exists = Number(rows[0]?.count) > 0
    if (!exists) {
      await rawQuery(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
      console.log(`[db] Migration: added ${table}.${column}`)
    }
  }

  for (const { table, column, definition } of NULLABLE_COLUMNS) {
    const { rows } = await rawQuery(
      `SELECT IS_NULLABLE FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
      [databaseName, table, column],
    )
    const alreadyNullable = rows[0]?.IS_NULLABLE === 'YES'
    if (!alreadyNullable) {
      await rawQuery(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${definition}`)
      console.log(`[db] Migration: made ${table}.${column} nullable`)
    }
  }

  await ensureUserStatusAllowsInactive(rawQuery, databaseName)
}
