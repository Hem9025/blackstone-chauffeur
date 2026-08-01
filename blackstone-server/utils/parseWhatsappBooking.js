// Best-effort heuristic parser for raw WhatsApp booking-request text pasted
// in by an admin (e.g. their own client's customer messaged them directly
// asking for a ride, instead of using the website form). It extracts a
// guess for each booking field so the admin can review/correct them in the
// New Booking form rather than retyping everything — it is NOT expected to
// be perfect, and every field it returns is editable before the booking is
// created.
//
// This is intentionally regex/keyword-based rather than AI-powered: no LLM
// API key is currently configured anywhere in this project, and this keeps
// the feature free and instant. If message formats turn out to be too
// unpredictable for this to be useful in practice, swapping this file's
// internals for an LLM call is a contained change — callers only depend on
// the shape of the object parseWhatsappBooking() returns.

const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function pad(n) {
  return String(n).padStart(2, '0')
}

function toISODate(year, month, day) {
  const d = new Date(year, month - 1, day)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// WhatsApp messages almost never include a year ("pickup on the 25th") — so
// a bare day/month is rolled forward to its next real occurrence rather
// than assumed to be this year (which could be in the past).
function nextOccurrence(month, day) {
  const now = new Date()
  let year = now.getFullYear()
  const candidate = new Date(year, month - 1, day)
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (candidate < todayMidnight) year += 1
  return toISODate(year, month, day)
}

// Returns { iso, raw } where `raw` is the matched substring, so the caller
// can strip it out before scanning for a phone number (long digit-heavy
// dates like 25/07/2026 would otherwise look like one).
function findDate(text) {
  let m = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/)
  if (m) return { iso: toISODate(+m[1], +m[2], +m[3]), raw: m[0] }

  m = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/)
  if (m) return { iso: toISODate(+m[3], +m[2], +m[1]), raw: m[0] }

  m = text.match(/\b(\d{1,2})[/-](\d{1,2})\b(?!\d)/)
  if (m && +m[1] <= 31 && +m[2] <= 12) return { iso: nextOccurrence(+m[2], +m[1]), raw: m[0] }

  // "30 July" / "30th July 2026" — scan every candidate match (not just the
  // first substring the regex happens to find, which is often an unrelated
  // "<number> <word>" like a street address) and use the first one whose
  // second word is a real month name.
  for (const cand of text.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)\s*(\d{4})?\b/g)) {
    const month = MONTHS[cand[2].toLowerCase()]
    if (!month) continue
    const iso = cand[3] ? toISODate(+cand[3], month, +cand[1]) : nextOccurrence(month, +cand[1])
    return { iso, raw: cand[0] }
  }

  // "July 30" / "Jul 30, 2026"
  for (const cand of text.matchAll(/\b([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/g)) {
    const month = MONTHS[cand[1].toLowerCase()]
    if (!month) continue
    const iso = cand[3] ? toISODate(+cand[3], month, +cand[2]) : nextOccurrence(month, +cand[2])
    return { iso, raw: cand[0] }
  }

  const lower = text.toLowerCase()
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return { iso: toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate()), raw: 'tomorrow' }
  }
  if (/\btoday\b|\btonight\b/.test(lower)) {
    const d = new Date()
    return { iso: toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate()), raw: 'today' }
  }
  const weekdayIdx = WEEKDAYS.findIndex((w) => new RegExp(`\\b${w}\\b`).test(lower))
  if (weekdayIdx !== -1) {
    const d = new Date()
    const diff = (weekdayIdx - d.getDay() + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    return { iso: toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate()), raw: WEEKDAYS[weekdayIdx] }
  }

  return null
}

function findTime(text) {
  let m = text.match(/\b(\d{1,2})[:.]?(\d{2})?\s*(am|pm)\b/i)
  if (m) {
    let hour = +m[1]
    const minute = m[2] ? +m[2] : 0
    const isPM = /pm/i.test(m[3])
    if (isPM && hour < 12) hour += 12
    if (!isPM && hour === 12) hour = 0
    return { hhmm: `${pad(hour)}:${pad(minute)}`, raw: m[0] }
  }
  m = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  if (m) return { hhmm: `${pad(+m[1])}:${m[2]}`, raw: m[0] }
  return null
}

function findEmail(text) {
  const m = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)
  return m ? m[0] : null
}

// Requires a digit, then 7+ digit/space/-/()/. characters, then a digit —
// long enough to catch real phone numbers but short enough to skip street
// numbers ("123 Queen Street"), which break the run at the first letter.
function findPhone(text) {
  const m = text.match(/(\+?\d[\d \-().]{7,}\d)/)
  return m ? m[1].trim() : null
}

function findHours(text) {
  const m = text.match(/(\d+)\s*(?:hours?|hrs?|hr)\b/i)
  return m ? Number(m[1]) : null
}

// Pulls the value after a label like "Pickup:" / "From -" — case
// insensitive, stops at a line break or the next comma/semicolon.
function findLabelled(text, labels) {
  for (const label of labels) {
    const re = new RegExp(`\\b${label}\\s*[:\\-]\\s*([^\\n,;]+)`, 'i')
    const m = text.match(re)
    if (m) return m[1].trim()
  }
  return null
}

// "from X to Y" written naturally in a sentence, when there's no explicit
// "Pickup:"/"Dropoff:" label.
function guessFromTo(text) {
  const m = text.match(/\bfrom\s+(.+?)\s+to\s+(.+?)(?:\son\b|\sat\b|[.,\n]|$)/i)
  return m ? { pickup: m[1].trim(), dropoff: m[2].trim() } : null
}

// "from X" / "pickup from X" with no "to Y" following (Hourly Hire, Wedding
// Service, or just a dropoff-less mention) — stops at the next "for"/"on"/
// "at"/"to" keyword, comma, or line break rather than requiring a label.
function guessFromOnly(text) {
  const m = text.match(/\bfrom\s+(.+?)(?:\sfor\b|\son\b|\sat\b|\sto\b|[.,\n]|$)/i)
  return m ? m[1].trim() : null
}

// Service Type is now just a two-value classification (Chauffeur Service /
// Airport Transfer) — "wedding"/"point-to-point" mentions no longer map to a
// distinct service type, but are still worth surfacing as a warning so the
// admin knows to check the notes field.
function guessServiceType(text) {
  const lower = text.toLowerCase()
  if (/\bairport\b/.test(lower)) return 'Airport Transfer'
  return 'Chauffeur Service'
}

// Trip Type: Hourly has no fixed dropoff and is priced by hours instead of
// distance. Everything else defaults to One Way unless a return/round-trip
// is mentioned.
function guessTripType(text) {
  const lower = text.toLowerCase()
  if (/\bhourly\b|\bhour hire\b|\bhire\b/.test(lower) || findHours(text)) return 'hourly'
  if (/\breturn\b|\bround.trip\b|\bround trip\b/.test(lower)) return 'return'
  return 'one_way'
}

// Only looks for a flight code when "flight" is actually mentioned, to avoid
// false-positives on unrelated two-letter+digits substrings.
function findFlightNumber(text) {
  if (!/\bflight\b/i.test(text)) return null
  const m = text.match(/\bflight\b[^A-Za-z0-9]{0,10}([A-Z]{2}\s?\d{2,4})/i)
  return m ? m[1].replace(/\s+/, '').toUpperCase() : null
}

function guessName(text) {
  const labelled = findLabelled(text, ['name', 'passenger', 'client', 'customer'])
  if (labelled) return labelled

  // Fallback: the first line that isn't a greeting, doesn't contain a phone
  // number/email/digit, and reads like "Firstname Lastname" (short, letters
  // only).
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(line)) continue
    if (findEmail(line) || /\d/.test(line)) continue
    if (line.split(/\s+/).length <= 4 && /^[A-Za-z .'-]+$/.test(line)) return line
  }
  return null
}

export function parseWhatsappBooking(rawText) {
  const text = String(rawText || '').trim()
  const warnings = []

  if (!text) {
    return {
      passenger_name: null, passenger_phone: null, passenger_email: null,
      pickup: null, dropoff: null, date: null, time: null,
      trip_type: 'one_way', service_type: 'Chauffeur Service', hours: null,
      flight_number: null,
      warnings: ['Paste some text to parse.'],
    }
  }

  const serviceType = guessServiceType(text)
  const tripType = guessTripType(text)
  const needsDropoff = tripType !== 'hourly'

  let pickup = findLabelled(text, ['pickup', 'pick up', 'pick-up'])
  let dropoff = findLabelled(text, ['dropoff', 'drop off', 'drop-off', 'destination', 'drop to', 'drop'])

  if (!pickup || !dropoff) {
    const fromTo = guessFromTo(text)
    if (fromTo) {
      pickup = pickup || fromTo.pickup
      dropoff = dropoff || fromTo.dropoff
    }
  }
  if (!pickup) pickup = findLabelled(text, ['from', 'address'])
  if (!pickup) pickup = guessFromOnly(text)

  const dateMatch = findDate(text)
  const strippedForPhone = dateMatch ? text.replace(dateMatch.raw, ' ') : text
  const timeMatch = findTime(text)

  const passenger_name = guessName(text)
  const passenger_phone = findPhone(strippedForPhone)
  const passenger_email = findEmail(text)
  const hours = tripType === 'hourly' ? findHours(text) : null
  const flight_number = serviceType === 'Airport Transfer' ? findFlightNumber(text) : null

  if (!passenger_name) warnings.push('Could not detect the passenger’s name — please fill it in.')
  if (!passenger_phone) warnings.push('Could not detect a phone number.')
  if (!pickup) warnings.push('Could not detect the pickup location.')
  if (needsDropoff && !dropoff) warnings.push('Could not detect the destination.')
  if (!dateMatch) warnings.push('Could not detect a date — double-check for an unusual format.')
  if (!timeMatch) warnings.push('Could not detect a time.')
  if (tripType === 'hourly' && !hours) warnings.push('Could not detect the number of hours.')
  if (/\bwedding\b/i.test(text)) warnings.push('Mentions "wedding" — Wedding Service is no longer a separate service type; check notes/add-ons.')
  if (/point.to.point/i.test(text)) warnings.push('Mentions "point-to-point" — that is no longer a separate service type; check trip type.')

  return {
    passenger_name,
    passenger_phone,
    passenger_email,
    pickup,
    dropoff: needsDropoff ? dropoff : null,
    date: dateMatch?.iso || null,
    time: timeMatch?.hhmm || null,
    trip_type: tripType,
    service_type: serviceType,
    hours,
    flight_number,
    warnings,
  }
}
