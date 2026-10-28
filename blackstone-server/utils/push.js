import 'dotenv/config' // ES imports run before server.js calls dotenv.config(), so load .env here too
import webpush from 'web-push'
import { query } from '../db/index.js'

// Web push sender. Needs VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in .env
// (generate once with `npm run vapid`). Without them push is silently off and
// the in-app bell keeps working as before.
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
export const pushEnabled = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)

if (pushEnabled) {
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:info@blackstonechauffeur.co.nz', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

// Sends one push per device for each user. Never throws. The body is
// deliberately generic — lock screens are visible to anyone nearby, so no
// names, addresses or prices go in it; the details are in the app.
export async function sendPush(userIds, { title, url = '/' }) {
  if (!pushEnabled) return
  const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean))]
  if (!ids.length) return
  try {
    const { rows } = await query(
      `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id IN (${ids.map(() => '?').join(',')})`,
      ids,
    )
    const payload = JSON.stringify({ title, body: 'Open the app to see the details.', url })
    await Promise.all(
      rows.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        } catch (err) {
          // 404/410 = the device unsubscribed or the app was removed — clean up.
          if (err.statusCode === 404 || err.statusCode === 410) {
            await query('DELETE FROM push_subscriptions WHERE id = ?', [s.id]).catch(() => {})
          } else {
            console.error('Push send failed', err.statusCode || err.message)
          }
        }
      }),
    )
  } catch (err) {
    console.error('Failed to send push', err)
  }
}
