import { query } from '../db/index.js'

// Creates one notification row per recipient — never throws, matching the
// established fire-and-forget pattern used for transactional emails
// throughout this app (a notification failure should never break the
// booking action that triggered it).
export async function notify(userIds, { type, title, message = null, link = null }) {
  const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean))]
  if (!ids.length) return
  try {
    const values = ids.map(() => '(?, ?, ?, ?, ?)').join(', ')
    const params = ids.flatMap((id) => [id, type, title, message, link])
    await query(`INSERT INTO notifications (user_id, type, title, message, link) VALUES ${values}`, params)
  } catch (err) {
    console.error('Failed to create notification', err)
  }
}

// Every admin + second_admin — for events any staff member should see (new
// booking, cancellation, etc.). `excludeUserId` skips telling an admin
// about their own action (e.g. admin editing a booking doesn't need to be
// told admin edited a booking).
export async function notifyAdmins({ type, title, message, link }, excludeUserId = null) {
  try {
    const { rows } = await query(
      `SELECT id FROM users WHERE role IN ('admin', 'second_admin')${excludeUserId ? ' AND id != ?' : ''}`,
      excludeUserId ? [excludeUserId] : [],
    )
    await notify(rows.map((r) => r.id), { type, title, message, link })
  } catch (err) {
    console.error('Failed to notify admins', err)
  }
}
