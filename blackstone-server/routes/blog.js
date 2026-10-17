import { Router } from 'express'
import { query } from '../db/index.js'
import authCheck from '../middleware/authCheck.js'
import { requirePermission } from '../middleware/requirePermission.js'

const router = Router()

// Columns PATCH /:id is allowed to touch — see routes/vehicles.js for why
// this is whitelisted rather than built from Object.keys(req.body).
const EDITABLE_POST_COLUMNS = [
  'title', 'slug', 'excerpt', 'body', 'cover_image', 'status', 'meta_title', 'meta_description',
]

function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200)
}

// Appends -2, -3, ... until the slug is free — checked against every post
// except (when editing) the post's own current row, so saving an untouched
// slug on an existing post never collides with itself.
async function ensureUniqueSlug(baseSlug, excludeId) {
  let slug = baseSlug || 'post'
  let suffix = 2
  // Bounded, not `while (true)` — a runaway loop here would hang the
  // request; 50 attempts is far more than any real slug collision needs.
  for (let i = 0; i < 50; i++) {
    const { rows } = await query(
      excludeId ? 'SELECT id FROM blog_posts WHERE slug = ? AND id != ?' : 'SELECT id FROM blog_posts WHERE slug = ?',
      excludeId ? [slug, excludeId] : [slug],
    )
    if (!rows.length) return slug
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }
  throw new Error('Failed to generate a unique slug')
}

// GET /api/blog — public, no auth. Published posts only, list view (no
// body — see GET /:slug for the full post).
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, title, slug, excerpt, cover_image, published_at
       FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC`,
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load blog posts' })
  }
})

// GET /api/blog/admin — admin, or second_admin with can_manage_bookings.
// Every post regardless of status, list view. Placed before GET /:slug so
// the literal path "admin" is never swallowed by that route's :slug param.
router.get('/admin', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    // total_views / views_30d come from the daily counts table (see
    // POST /:slug/view below). COALESCE so a post with no views yet shows 0
    // instead of null.
    const { rows } = await query(
      `SELECT p.id, p.title, p.slug, p.status, p.published_at, p.updated_at,
              COALESCE((SELECT SUM(v.views) FROM blog_post_views v WHERE v.post_id = p.id), 0) AS total_views,
              COALESCE((SELECT SUM(v.views) FROM blog_post_views v
                        WHERE v.post_id = p.id AND v.view_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)), 0) AS views_30d
       FROM blog_posts p ORDER BY p.updated_at DESC`,
    )
    res.json(rows.map((r) => ({ ...r, total_views: Number(r.total_views), views_30d: Number(r.views_30d) })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load blog posts' })
  }
})

// GET /api/blog/admin/:id — admin, full row (including body) for editing.
router.get('/admin/:id', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM blog_posts WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Post not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load post' })
  }
})

// GET /api/blog/:slug — public, no auth. Only ever returns a published
// post — a draft's URL isn't a real page until it's published, same as it
// not appearing in GET / above.
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'`, [req.params.slug])
    if (!rows.length) return res.status(404).json({ message: 'Post not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load post' })
  }
})

// Obvious crawlers/previewers — not counted as views. This isn't bot-proof
// (nothing client-side is), it just keeps Googlebot, link previews and
// uptime checkers from inflating the numbers.
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests/i

// POST /api/blog/:slug/view — public, no auth. Called once per visitor
// session by the public post page (see BlogPost.jsx). Only counts published
// posts, and always answers 204 so a tracking hiccup can never break
// reading a post.
router.post('/:slug/view', async (req, res) => {
  try {
    if (BOT_UA.test(req.get('user-agent') || '')) return res.status(204).end()
    const { rows } = await query(`SELECT id FROM blog_posts WHERE slug = ? AND status = 'published'`, [req.params.slug])
    if (rows.length) {
      await query(
        `INSERT INTO blog_post_views (post_id, view_date, views) VALUES (?, CURDATE(), 1)
         ON DUPLICATE KEY UPDATE views = views + 1`,
        [rows[0].id],
      )
    }
  } catch (err) {
    console.error(err)
  }
  res.status(204).end()
})

// POST /api/blog — admin, or second_admin with can_manage_bookings
router.post('/',authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  const { title, slug, excerpt, body, cover_image, status, meta_title, meta_description } = req.body || {}
  const resolvedTitle = String(title || '').trim()
  const resolvedBody = String(body || '').trim()
  if (!resolvedTitle) return res.status(400).json({ message: 'Title is required' })
  if (!resolvedBody) return res.status(400).json({ message: 'Body is required' })
  const resolvedStatus = status === 'published' ? 'published' : 'draft'

  try {
    const resolvedSlug = await ensureUniqueSlug(slugify(slug || resolvedTitle))
    const inserted = await query(
      `INSERT INTO blog_posts
        (title, slug, excerpt, body, cover_image, status, meta_title, meta_description, author_id, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resolvedTitle,
        resolvedSlug,
        excerpt ? String(excerpt).trim().slice(0, 500) : null,
        resolvedBody,
        cover_image ? String(cover_image).trim() : null,
        resolvedStatus,
        meta_title ? String(meta_title).trim().slice(0, 255) : null,
        meta_description ? String(meta_description).trim().slice(0, 500) : null,
        req.user.id,
        resolvedStatus === 'published' ? new Date() : null,
      ],
    )
    const { rows } = await query('SELECT * FROM blog_posts WHERE id = ?', [inserted.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create post' })
  }
})

// PATCH /api/blog/:id — admin, or second_admin with can_manage_bookings
router.patch('/:id', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  const fields = req.body || {}
  const { rows: existingRows } = await query('SELECT status, published_at FROM blog_posts WHERE id = ?', [req.params.id])
  if (!existingRows.length) return res.status(404).json({ message: 'Post not found' })
  const existing = existingRows[0]

  try {
    const keys = Object.keys(fields).filter((k) => EDITABLE_POST_COLUMNS.includes(k))
    if (!keys.length) return res.status(400).json({ message: 'No recognised fields to update' })

    const sets = []
    const values = []
    for (const k of keys) {
      if (k === 'slug') {
        sets.push('slug = ?')
        values.push(await ensureUniqueSlug(slugify(fields.slug), req.params.id))
      } else if (k === 'status') {
        const resolvedStatus = fields.status === 'published' ? 'published' : 'draft'
        sets.push('status = ?')
        values.push(resolvedStatus)
        // First time this post ever goes live — stamp published_at once,
        // never move it on a later status toggle or edit.
        if (resolvedStatus === 'published' && !existing.published_at) {
          sets.push('published_at = ?')
          values.push(new Date())
        }
      } else {
        sets.push(`${k} = ?`)
        values.push(fields[k])
      }
    }

    await query(`UPDATE blog_posts SET ${sets.join(', ')} WHERE id = ?`, [...values, req.params.id])
    const { rows } = await query('SELECT * FROM blog_posts WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update post' })
  }
})

// DELETE /api/blog/:id — admin, or second_admin with can_manage_bookings.
// A real deletion — nothing else references a blog post by id.
router.delete('/:id', authCheck, requirePermission('can_manage_bookings'), async (req, res) => {
  try {
    const { rows } = await query('SELECT id FROM blog_posts WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Post not found' })
    await query('DELETE FROM blog_posts WHERE id = ?', [req.params.id])
    res.json({ message: 'Post deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete post' })
  }
})

export default router
