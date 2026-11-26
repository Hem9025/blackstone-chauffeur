import 'dotenv/config'
import fs from 'fs'
import { query } from '../db/index.js'

// Push notifications for the installed phone app (Android + iPhone) through
// Firebase Cloud Messaging. Stays completely OFF until a Firebase service
// account is configured — set ONE of these in the server's .env:
//   FIREBASE_SERVICE_ACCOUNT_JSON = the whole service-account JSON on one line
//   FIREBASE_SERVICE_ACCOUNT_PATH = path to the downloaded JSON file
// (Firebase console > Project settings > Service accounts > Generate new
// private key.) iPhone also needs the Apple push key uploaded in Firebase.
// Without it nothing here runs and the website/web push are unaffected.

let messagingPromise = null

function loadCredentials() {
  const { FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH } = process.env
  if (FIREBASE_SERVICE_ACCOUNT_JSON) return JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON)
  if (FIREBASE_SERVICE_ACCOUNT_PATH) return JSON.parse(fs.readFileSync(FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'))
  return null
}

export const nativePushConfigured = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
)

// firebase-admin is imported on first use so the server still starts if the
// package or the credentials aren't there.
function getMessaging() {
  if (!nativePushConfigured) return null
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const admin = (await import('firebase-admin')).default
      const credentials = loadCredentials()
      const app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(credentials) })
      return admin.messaging(app)
    })().catch((err) => {
      console.error('Native push is configured but could not start', err.message)
      messagingPromise = null
      return null
    })
  }
  return messagingPromise
}

// Same rule as web push: the text is generic (lock screens are visible to
// anyone nearby), details are in the app. Never throws.
export async function sendNativePush(userIds, { title, url = '/' }) {
  if (!nativePushConfigured) return
  const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean))]
  if (!ids.length) return
  try {
    const messaging = await getMessaging()
    if (!messaging) return
    const { rows } = await query(
      `SELECT id, token FROM device_tokens WHERE user_id IN (${ids.map(() => '?').join(',')})`,
      ids,
    )
    await Promise.all(
      rows.map(async (d) => {
        try {
          await messaging.send({
            token: d.token,
            notification: { title, body: 'Open the app to see the details.' },
            data: { url: String(url) },
          })
        } catch (err) {
          // Token no longer valid (app removed / reinstalled) — clean it up.
          if (/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(err.code || err.message || '')) {
            await query('DELETE FROM device_tokens WHERE id = ?', [d.id]).catch(() => {})
          } else {
            console.error('Native push send failed', err.code || err.message)
          }
        }
      }),
    )
  } catch (err) {
    console.error('Failed to send native push', err)
  }
}
