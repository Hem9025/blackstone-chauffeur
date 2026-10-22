// Diagnoses why Google reviews aren't showing on the site.
//
//   node scripts/checkGoogleReviews.js
//   node scripts/checkGoogleReviews.js "BlackStone Chauffeur Auckland"   (also searches for the Place ID)
//
// It calls Google with the SAME key and Place ID the server uses and prints
// Google's own answer, which says exactly what's wrong (the site itself only
// shows "no reviews" and hides the reason).

import dotenv from 'dotenv'
dotenv.config()

const key = process.env.GOOGLE_PLACES_API_KEY
const placeId = process.env.GOOGLE_PLACE_ID
const searchText = process.argv[2]

const HINTS = {
  REQUEST_DENIED:
    'Key rejected. Usual causes: (1) "Places API" (the classic one, not only "Places API (New)") is not enabled for this key\'s project; (2) the key is restricted to HTTP referrers/websites — a server call has no referrer, so use a SEPARATE key for the server restricted by IP (or unrestricted + API-restricted to Places API); (3) billing is not enabled on the Google Cloud project.',
  INVALID_REQUEST: 'The Place ID is malformed or missing.',
  NOT_FOUND: 'Google has no place with this Place ID (stale or wrong ID). Run this script with a search text to find the right one.',
  ZERO_RESULTS: 'Google found nothing for that search.',
  OVER_QUERY_LIMIT: 'Quota exceeded or billing problem on the Google Cloud project.',
}

async function getJson(url) {
  const res = await fetch(url)
  return res.json()
}

if (!key || key.startsWith('replace-with')) {
  console.log('✗ GOOGLE_PLACES_API_KEY is not set in blackstone-server/.env')
  process.exit(1)
}

if (searchText) {
  const u = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json')
  u.searchParams.set('input', searchText)
  u.searchParams.set('inputtype', 'textquery')
  u.searchParams.set('fields', 'place_id,name,formatted_address,rating,user_ratings_total')
  u.searchParams.set('key', key)
  const data = await getJson(u)
  console.log(`\nSearch "${searchText}" → ${data.status}`)
  if (data.error_message) console.log('  Google says:', data.error_message)
  for (const c of data.candidates || []) {
    console.log(`  • ${c.name} — ${c.formatted_address || '(no address)'} — ${c.rating ?? 'no rating'} (${c.user_ratings_total ?? 0} reviews)`)
    console.log(`    PLACE ID: ${c.place_id}`)
  }
  if (HINTS[data.status]) console.log('  →', HINTS[data.status])
}

if (!placeId) {
  console.log('\n✗ GOOGLE_PLACE_ID is not set in blackstone-server/.env')
  process.exit(1)
}

const u = new URL('https://maps.googleapis.com/maps/api/place/details/json')
u.searchParams.set('place_id', placeId)
u.searchParams.set('fields', 'name,rating,user_ratings_total,reviews,url')
u.searchParams.set('key', key)
const data = await getJson(u)

console.log(`\nDetails for GOOGLE_PLACE_ID=${placeId} → ${data.status}`)
if (data.error_message) console.log('  Google says:', data.error_message)
if (data.status === 'OK') {
  const r = data.result || {}
  console.log(`  Name: ${r.name}\n  Rating: ${r.rating ?? 'none'} from ${r.user_ratings_total ?? 0} reviews\n  Reviews returned: ${(r.reviews || []).length}`)
  if (!(r.reviews || []).length) {
    console.log('  → The ID and key work, but Google returned no reviews. Reviews only appear once the listing has public reviews (Google returns up to 5).')
  } else {
    console.log('  ✓ Working. Restart the server; reviews are cached for 1 hour.')
  }
} else if (HINTS[data.status]) {
  console.log('  →', HINTS[data.status])
}
