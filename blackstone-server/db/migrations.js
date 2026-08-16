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
]

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
}
