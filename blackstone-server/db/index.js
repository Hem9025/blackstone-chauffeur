import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blackstone',
}

export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
})

pool.on('error', (err) => {
  console.error('Unexpected MySQL pool error', err)
})

// Columns stored as JSON. Real MySQL has a native JSON column type, and
// mysql2 auto-parses those into JS arrays/objects. MariaDB (what XAMPP
// bundles on Mac, and what some hosts ship instead of real MySQL) has no
// native JSON type — it's plain TEXT with a validity check — so mysql2 has
// no type marker to auto-parse against and returns the raw JSON string
// instead. Normalizing here means the rest of the app always sees real
// arrays/objects no matter which of the two the server is actually running.
const JSON_COLUMNS = ['distance_tiers', 'features', 'extras']

function parseJsonColumns(row) {
  for (const col of JSON_COLUMNS) {
    if (typeof row[col] === 'string') {
      try {
        row[col] = JSON.parse(row[col])
      } catch {
        // Not valid JSON — leave it as-is rather than throw.
      }
    }
  }
  return row
}

// Normalizes mysql2's [rows] / [ResultSetHeader] return shape into a single
// { rows, insertId, affectedRows } object so route files can read `.rows`
// the same way regardless of query type (SELECT vs INSERT/UPDATE/DELETE).
async function rawQuery(sql, params = []) {
  const [result] = await pool.query(sql, params)
  if (Array.isArray(result)) {
    return { rows: result.map(parseJsonColumns) }
  }
  return { rows: [], insertId: result.insertId, affectedRows: result.affectedRows, raw: result }
}

// Applies schema.sql (safe to re-run — every statement is a CREATE TABLE IF
// NOT EXISTS or a guarded INSERT) and seeds demo data the first time the
// server talks to the database, so a fresh local MySQL instance is usable
// immediately after `npm run dev` without a separate manual migration step.
let readyPromise = null

async function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      try {
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
        // A dedicated connection with multipleStatements enabled, used only
        // for this one schema-file execution — the shared pool above keeps
        // multipleStatements off for normal query safety.
        const setupConn = await mysql.createConnection({ ...dbConfig, multipleStatements: true })
        try {
          await setupConn.query(schema)
        } finally {
          await setupConn.end()
        }

        const { runMigrations } = await import('./migrations.js')
        await runMigrations(rawQuery, dbConfig.database)

        const { runSeed } = await import('./seed.js')
        // Bypass the public query()/ensureReady() gate below — calling back
        // through query() here would await this very promise and deadlock.
        await runSeed({ silent: true, queryFn: rawQuery })

        console.log(`[db] Connected to MySQL database "${dbConfig.database}" on ${dbConfig.host}:${dbConfig.port}.`)
        console.log('[db] Schema verified, demo data seeded.')
        console.log('[db] Demo logins ready (password: Password123!): admin@demo.com, provider@demo.com, customer@demo.com, driver@demo.com')
      } catch (err) {
        readyPromise = null // allow a retry on the next query instead of failing forever
        if (err.code === 'ER_BAD_DB_ERROR') {
          console.error(
            `[db] Database "${dbConfig.database}" doesn't exist yet. Create it first, e.g.:\n` +
              `  mysql -u ${dbConfig.user} -p -e "CREATE DATABASE ${dbConfig.database}"`,
          )
        } else if (err.code === 'ECONNREFUSED') {
          console.error(
            `[db] Could not reach MySQL at ${dbConfig.host}:${dbConfig.port}. Is your local MySQL server running?`,
          )
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
          console.error('[db] MySQL access denied — check DB_USER / DB_PASSWORD in .env.')
        }
        throw err
      }
    })()
  }
  return readyPromise
}

export async function query(sql, params = []) {
  await ensureReady()
  return rawQuery(sql, params)
}

export async function closeDb() {
  await pool.end()
}
