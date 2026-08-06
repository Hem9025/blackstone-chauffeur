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

// "4 passengers" / "4 pax" / "party of 4" / "for 5 people" — deliberately
// label/keyword-anchored (not a bare "for 4") since a bare number is too
// easy to confuse with hours, a time, or an address.
function findPassengerCount(text) {
  let m = text.match(/(\d+)\s*(?:passengers?|pax|people|persons?|adults?|guests?)\b/i)
  if (m) return Number(m[1])
  m = text.match(/\bparty\s+of\s+(\d+)\b/i)
  if (m) return Number(m[1])
  return null
}

// "3 bags" / "2 suitcases" / "2 pieces of luggage"
function findLuggageCount(text) {
  let m = text.match(/(\d+)\s*(?:bags?|suitcases?|luggage)\b/i)
  if (m) return Number(m[1])
  m = text.match(/(\d+)\s*(?:pieces?)\s+of\s+luggage\b/i)
  if (m) return Number(m[1])
  return null
}

// Only fires on an explicit label ("Ref:", "Booking number -", "PNR ...")
// since guessing a bare code out of free text is too unreliable — but once
// one of those labels is present, accepts ":"/"-"/"#" or no separator at
// all before the code, and requires the captured token contain a digit so
// it can't accidentally swallow an ordinary word like "from" or "for".
function findReferenceNumber(text) {
  const re = /\b(?:reference\s*(?:no\.?|number)?|ref\s*(?:no\.?|number|#)?|booking\s*(?:ref(?:erence)?|no\.?|number)|confirmation\s*(?:no\.?|number)?|pnr|order\s*(?:no\.?|number))\s*[:#\-]?\s*([A-Za-z0-9][A-Za-z0-9\-/]{1,19})\b/i
  const m = text.match(re)
  if (!m) return null
  const token = m[1]
  if (!/\d/.test(token)) return null
  return token.toUpperCase()
}

// Only fires on an explicit label, same reasoning as findReferenceNumber —
// unlike findLabelled (used for pickup/dropoff), this reads to the end of
// the line rather than stopping at a comma, since a note is often a list
// ("child seat, extra bags, meet at arrivals").
function findNotes(text) {
  const labels = [
    'notes?', 'special requests?', 'remarks?', 'additional (?:info|information|notes?)',
    'service notes?', 'instructions?', 'comments?',
  ]
  for (const label of labels) {
    const re = new RegExp(`\\b${label}\\s*[:\\-]\\s*([^\\n]+)`, 'i')
    const m = text.match(re)
    if (m) return m[1].trim().slice(0, 250)
  }
  return null
}

function normalizeCompact(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Tries to match a specific vehicle from the live fleet against the pasted
// text — first by its full name mentioned verbatim (e.g. "Business Van"),
// then by any single word that belongs to exactly one active vehicle's name
// (e.g. "SUV" when only one vehicle has "SUV" in its name). A word shared by
// several vehicles ("sedan", "van", "economy"...) is deliberately never used
// on its own, since it can't be attributed to one specific vehicle.
function guessVehicle(text, vehicles) {
  if (!Array.isArray(vehicles) || !vehicles.length) return null
  const compactText = normalizeCompact(text)

  for (const v of vehicles) {
    const compactName = normalizeCompact(v.name)
    if (compactName.length >= 4 && compactText.includes(compactName)) {
      return { id: v.id, name: v.name }
    }
  }

  const wordOwners = new Map()
  for (const v of vehicles) {
    const words = new Set(String(v.name).toLowerCase().match(/[a-z0-9]+/g) || [])
    for (const w of words) {
      if (w.length < 2) continue
      if (!wordOwners.has(w)) wordOwners.set(w, new Set())
      wordOwners.get(w).add(v.id)
    }
  }
  const textWords = new Set(text.toLowerCase().match(/[a-z0-9]+/g) || [])
  for (const [word, owners] of wordOwners) {
    if (owners.size === 1 && textWords.has(word)) {
      const id = [...owners][0]
      const v = vehicles.find((x) => x.id === id)
      if (v) return { id: v.id, name: v.name }
    }
  }

  return null
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

// `vehicles` is optional — the list of currently active vehicles (from
// GET /api/vehicles), used only to try to match a mentioned car/vehicle
// type to a specific one. Parsing still works fine without it; it just
// skips the vehicle guess.
export function parseWhatsappBooking(rawText, vehicles = []) {
  const text = String(rawText || '').trim()
  const warnings = []

  if (!text) {
    return {
      passenger_name: null, passenger_phone: null, passenger_email: null,
      pickup: null, dropoff: null, date: null, time: null,
      trip_type: 'one_way', service_type: 'Chauffeur Service', hours: null,
      flight_number: null, passengers: null, suitcases: null,
      reference_number: null, notes: null, vehicle_id: null, vehicle_name: null,
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
  const passengers = findPassengerCount(text)
  const suitcases = findLuggageCount(text)
  const reference_number = findReferenceNumber(text)
  const notes = findNotes(text)
  const vehicleMatch = guessVehicle(text, vehicles)

  if (!passenger_name) warnings.push('Could not detect the passenger’s name — please fill it in.')
  if (!passenger_phone) warnings.push('Could not detect a phone number.')
  if (!pickup) warnings.push('Could not detect the pickup location.')
  if (needsDropoff && !dropoff) warnings.push('Could not detect the destination.')
  if (!dateMatch) warnings.push('Could not detect a date — double-check for an unusual format.')
  if (!timeMatch) warnings.push('Could not detect a time.')
  if (tripType === 'hourly' && !hours) warnings.push('Could not detect the number of hours.')
  if (/\bwedding\b/i.test(text)) warnings.push('Mentions "wedding" — Wedding Service is no longer a separate service type; check notes/add-ons.')
  if (/point.to.point/i.test(text)) warnings.push('Mentions "point-to-point" — that is no longer a separate service type; check trip type.')
  if (vehicleMatch) warnings.push(`Guessed vehicle: ${vehicleMatch.name} — please confirm it's right.`)

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
    passengers,
    suitcases,
    reference_number,
    notes,
    vehicle_id: vehicleMatch?.id || null,
    vehicle_name: vehicleMatch?.name || null,
    warnings,
  }
}
