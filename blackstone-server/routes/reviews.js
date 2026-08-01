import express from 'express'

const router = express.Router()

// Simple in-memory cache so we don't hit the Google Places API on every page
// load — reviews change rarely, so a long TTL is fine and keeps us well
// under any API quota.
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
let cache = { data: null, fetchedAt: 0 }

// GET /api/reviews
// Returns Google Business reviews for the place configured via
// GOOGLE_PLACE_ID. Requires GOOGLE_PLACES_API_KEY to be set (a Places API
// key from Google Cloud Console — this can be the same key used for Maps,
// as long as the "Places API" is enabled on it).
//
// Until both env vars are set, this responds with `configured: false` and
// an empty review list rather than erroring, so the client can silently
// fall back to its placeholder testimonials.
router.get('/', async (req, res) => {
  const placeId = process.env.GOOGLE_PLACE_ID
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!placeId || !apiKey) {
    return res.json({ configured: false, rating: null, totalReviews: 0, reviews: [] })
  }

  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return res.json(cache.data)
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    url.searchParams.set('place_id', placeId)
    url.searchParams.set('fields', 'name,rating,user_ratings_total,reviews,url')
    url.searchParams.set('reviews_no_translations', 'true')
    url.searchParams.set('key', apiKey)

    const googleRes = await fetch(url)
    const googleData = await googleRes.json()

    if (googleData.status !== 'OK') {
      console.error('[reviews] Google Places API error:', googleData.status, googleData.error_message)
      return res.json({ configured: true, rating: null, totalReviews: 0, reviews: [], error: googleData.status })
    }

    const result = googleData.result || {}
    const payload = {
      configured: true,
      placeUrl: result.url || null,
      rating: result.rating ?? null,
      totalReviews: result.user_ratings_total ?? 0,
      reviews: (result.reviews || []).map((r) => ({
        author: r.author_name,
        avatar: r.profile_photo_url,
        rating: r.rating,
        text: r.text,
        relativeTime: r.relative_time_description,
        time: r.time,
      })),
    }

    cache = { data: payload, fetchedAt: Date.now() }
    return res.json(payload)
  } catch (err) {
    console.error('[reviews] Failed to fetch Google reviews:', err)
    return res.json({ configured: true, rating: null, totalReviews: 0, reviews: [], error: 'fetch_failed' })
  }
})

export default router
