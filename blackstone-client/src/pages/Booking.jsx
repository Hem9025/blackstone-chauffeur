import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { useJsApiLoader } from '@react-google-maps/api'
import {
  Calendar, Clock, Users, Briefcase, Info,
  Check, ArrowRight, ArrowLeft, ShieldCheck, RotateCcw, Headphones, BadgeDollarSign, Plus, X, Plane,
} from 'lucide-react'
import PageMeta from '../components/PageMeta'
import StripePaymentForm from '../components/StripePaymentForm'
import PlacesAutocompleteInput from '../components/PlacesAutocompleteInput'
import RouteMap from '../components/RouteMap'
import { vehicles as vehiclesApi, bookings as bookingsApi } from '../utils/api'
import { formatCurrency } from '../utils/helpers'
import { calculateFare, tierPriceForDistance } from '../utils/pricing'
import { useAuth } from '../context/AuthContext'
import { minBookingDate, isDateFarEnoughAhead, MIN_ADVANCE_DAYS } from '../utils/bookingRules'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')
const GOOGLE_MAPS_LIBRARIES = ['places']

// Flat, one-time toggle add-ons — matches seeded rows in db/schema.sql.
// Extra Wait Time used to live here as a flat toggle too, but is now a
// slider priced per-minute (see EXTRA_WAIT_MAX_PRICE below) instead.
// Swap for a GET /api/add-ons call if that endpoint gets added later.
const ADD_ONS = [
  { id: 'VIP Airport Pickup', name: 'VIP Airport Pickup', price: 30 },
]

// Quantity-based add-ons, priced per unit rather than a flat toggle.
const CHILD_SEAT_PRICE = 15
const CHILD_SEAT_MAX = 2
const STOP_PRICE = 20
const STOPS_MAX = 5

// Extra Wait Time slider — 5 to 60 minutes, priced proportionally up to the
// same $20 the old flat toggle charged at the 60-minute (1 hour) mark.
// Server-side price is recalculated from the same formula — see
// routes/bookings.js — never trusted from the client directly.
const EXTRA_WAIT_MIN_MINUTES = 5
const EXTRA_WAIT_MAX_MINUTES = 60
const EXTRA_WAIT_MAX_PRICE = 20
const EXTRA_WAIT_STEP = 5

function extraWaitPrice(minutes) {
  if (!minutes) return 0
  return Math.round((minutes / EXTRA_WAIT_MAX_MINUTES) * EXTRA_WAIT_MAX_PRICE * 100) / 100
}

const HOURS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 10, 12]

const STEPS = [
  { id: 1, label: 'Journey Information', desc: 'Provide your trip details' },
  { id: 2, label: 'Select Vehicle', desc: 'Choose your preferred vehicle' },
  { id: 3, label: 'Payment', desc: 'Secure and confirm your booking' },
]

// A handful of the most consequential points from the full Terms &
// Conditions (see /terms), surfaced here so customers see the important
// parts before paying rather than only in the linked full document.
const KEY_TERMS = [
  'Cancellations within 48 hours of pickup may be charged up to 100% of the booking price.',
  'A no-show may be charged the full booking price, plus any waiting, parking, or toll costs already incurred.',
  'Prices are estimates until confirmed — extra waiting time, stops, or route changes may add to the total.',
  "BlackStone isn't liable for delays outside its control (traffic, weather, flight changes) — please allow sufficient travel time.",
]

const HAS_MAPS_KEY = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)

// Persists the in-progress booking form (current step + every filled field)
// across a page refresh, so reloading /booking lands back on the exact same
// step with the exact same details instead of resetting. sessionStorage
// (not localStorage) is deliberate — it survives a refresh but clears when
// the tab closes, so a finished or abandoned booking doesn't linger and
// resurface in a later, unrelated visit. Cleared explicitly once payment
// succeeds — see handlePaymentSuccess().
const DRAFT_KEY = 'bc_booking_draft'

function loadBookingDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function clearBookingDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // sessionStorage unavailable — nothing to clean up either way.
  }
}

// Only calls useJsApiLoader (and so only injects Google's script tag) when a
// key is actually configured — with no key, Google's script still loads but
// responds with its own on-page error/watermark, which is what caused the
// stray grey banner. Skipping the load entirely avoids that.
function BookingWithMapsLoader() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })
  return <BookingContent mapsLoaded={isLoaded} />
}

export default function Booking() {
  return HAS_MAPS_KEY ? <BookingWithMapsLoader /> : <BookingContent mapsLoaded={false} />
}

function BookingContent({ mapsLoaded }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Loaded once, synchronously, before any of the state below initializes —
  // a saved draft (from a previous visit in this same tab) takes priority
  // over the URL's query params, since resuming an in-progress booking
  // matters more than re-applying a homepage Quick Book link.
  const [draft] = useState(loadBookingDraft)

  const [step, setStep] = useState(draft?.step ?? 1)
  const [vehicleList, setVehicleList] = useState([])
  const [tripType, setTripType] = useState(draft?.tripType ?? 'one_way')
  // Replaces the old Service Type dropdown — a plain checkbox toggling
  // airport handling (flight number requirement, waiting-time messaging)
  // instead of a "Chauffeur Service" / "Airport Transfer" select. Still
  // sent to the backend as service_type so the DB column/reporting is
  // unchanged.
  const [isAirport, setIsAirport] = useState(draft?.isAirport ?? false)
  const serviceType = isAirport ? 'Airport Transfer' : 'Chauffeur Service'
  // Pre-filled from the homepage Quick Book widget's query params, if present
  // (e.g. /booking?pickup=...&dropoff=...&date=...). The widget only sends
  // addresses as text — no lat/lng — so the map/route won't compute until
  // the user re-picks the address from the autocomplete dropdown.
  const [pickup, setPickup] = useState(draft?.pickup ?? { address: searchParams.get('pickup') || '', lat: null, lng: null })
  const [dropoff, setDropoff] = useState(draft?.dropoff ?? { address: searchParams.get('dropoff') || '', lat: null, lng: null })
  const [date, setDate] = useState(draft?.date ?? searchParams.get('date') ?? '')
  const [time, setTime] = useState(draft?.time ?? '')
  const [hours, setHours] = useState(draft?.hours ?? '')
  const [passengers, setPassengers] = useState(draft?.passengers ?? 1)
  const [luggage, setLuggage] = useState(draft?.luggage ?? 0)
  const [notes, setNotes] = useState(draft?.notes ?? '')
  const [route, setRoute] = useState(null)
  const [vehicleId, setVehicleId] = useState(draft?.vehicleId ?? searchParams.get('vehicleId') ?? '')
  const [selectedAddOns, setSelectedAddOns] = useState(draft?.selectedAddOns ?? [])
  // Each stop is { address, lat, lng } — same shape as pickup/dropoff — so
  // it can be routed as a Directions waypoint once resolved via autocomplete.
  const [stops, setStops] = useState(draft?.stops ?? [])
  const [childSeats, setChildSeats] = useState(draft?.childSeats ?? 0)
  const [flightNumber, setFlightNumber] = useState(draft?.flightNumber ?? '')
  const [extraWaitMinutes, setExtraWaitMinutes] = useState(draft?.extraWaitMinutes ?? 0)
  const [acceptedTerms, setAcceptedTerms] = useState(draft?.acceptedTerms ?? false)
  const [clientSecret, setClientSecret] = useState(draft?.clientSecret ?? '')
  const [bookingId, setBookingId] = useState(draft?.bookingId ?? null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Keeps the draft in sessionStorage in sync with every field above, so a
  // refresh at any point in the flow (including mid-payment on step 3)
  // restores exactly where the user left off.
  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          step, tripType, isAirport, pickup, dropoff, date, time, hours,
          passengers, luggage, notes, vehicleId, selectedAddOns, stops,
          childSeats, flightNumber, extraWaitMinutes, acceptedTerms,
          clientSecret, bookingId,
        }),
      )
    } catch {
      // sessionStorage unavailable (e.g. private browsing) — the form still
      // works, it just won't survive a refresh. Not worth surfacing.
    }
  }, [
    step, tripType, isAirport, pickup, dropoff, date, time, hours,
    passengers, luggage, notes, vehicleId, selectedAddOns, stops,
    childSeats, flightNumber, extraWaitMinutes, acceptedTerms,
    clientSecret, bookingId,
  ])

  useEffect(() => {
    vehiclesApi.list().then(setVehicleList).catch(() => setVehicleList([]))
  }, [])

  const selectedVehicle = vehicleList.find((v) => String(v.id) === String(vehicleId))

  // A vehicleId can be sitting in state without actually matching a real
  // vehicle — e.g. a pre-filled ?vehicleId= that's since been deactivated,
  // or a resumed sessionStorage draft from before a vehicle was removed.
  // Once the real vehicle list has loaded, clear it in that case so the
  // Select Vehicle step doesn't silently look "chosen" with nothing
  // actually highlighted, and so Continue can't be clicked through to
  // payment with no vehicle (and no vehicle cost) attached.
  useEffect(() => {
    if (!vehicleId || !vehicleList.length) return
    if (!vehicleList.some((v) => String(v.id) === String(vehicleId))) setVehicleId('')
  }, [vehicleList, vehicleId])

  // Passengers/luggage are capped to whichever vehicle is selected — with
  // none selected yet, there's no capacity to check against, so cap at the
  // bare minimum (1 passenger, 0 luggage) rather than letting the counters
  // run free. This nudges the flow toward "pick a vehicle first."
  const maxPassengers = selectedVehicle ? Number(selectedVehicle.passengers) || 1 : 1
  const maxLuggage = selectedVehicle ? Number(selectedVehicle.suitcases) || 0 : 0

  // If the customer switches to a smaller vehicle after already bumping
  // passengers/luggage up, pull those counts back down to fit.
  useEffect(() => {
    setPassengers((p) => Math.min(p, maxPassengers))
    setLuggage((l) => Math.min(l, maxLuggage))
  }, [maxPassengers, maxLuggage])

  // Hourly is a trip type, not a service type — it has no dropoff/route and
  // is priced by hours (via price_per_minute) instead.
  const needsDropoff = tripType !== 'hourly'
  const needsHours = tripType === 'hourly'
  const needsFlightNumber = isAirport
  const effectiveDistanceKm = needsDropoff ? route?.distanceKm : undefined
  const effectiveDurationMin = needsHours ? Number(hours || 0) * 60 : needsDropoff ? route?.durationMin : 0

  const flatAddOnsTotal = selectedAddOns.reduce((sum, id) => {
    const addOn = ADD_ONS.find((a) => a.id === id)
    return sum + (addOn ? addOn.price : 0)
  }, 0)
  const stopCount = needsDropoff ? stops.length : 0
  const extraWaitCost = extraWaitPrice(extraWaitMinutes)
  const quantityAddOnsTotal = childSeats * CHILD_SEAT_PRICE + stopCount * STOP_PRICE
  const addOnsTotal = flatAddOnsTotal + quantityAddOnsTotal + extraWaitCost

  const baseFare = useMemo(
    () =>
      selectedVehicle && needsDropoff && route
        ? tierPriceForDistance(selectedVehicle.distance_tiers, route.distanceKm)
        : 0,
    [selectedVehicle, route, needsDropoff],
  )

  const total = useMemo(
    () =>
      selectedVehicle
        ? calculateFare({
            vehicle: selectedVehicle,
            distanceKm: effectiveDistanceKm,
            durationMin: effectiveDurationMin,
            passengers,
            suitcases: luggage,
            addOnsTotal,
          })
        : 0,
    [selectedVehicle, effectiveDistanceKm, effectiveDurationMin, passengers, luggage, addOnsTotal],
  )

  function toggleAddOn(id) {
    setSelectedAddOns((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  function addStop() {
    setStops((prev) => (prev.length >= STOPS_MAX ? prev : [...prev, { address: '', lat: null, lng: null }]))
  }
  function removeStop(index) {
    setStops((prev) => prev.filter((_, i) => i !== index))
  }
  function updateStopAddress(index, address) {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, address, lat: null, lng: null } : s)))
  }
  function setStopPlace(index, place) {
    setStops((prev) => prev.map((s, i) => (i === index ? place : s)))
  }

  function goToStep1Valid() {
    if (!pickup.address || !date || !time || !isDateFarEnoughAhead(date)) return false
    if (needsDropoff && !dropoff.address) return false
    if (needsHours && !hours) return false
    if (isAirport && !flightNumber.trim()) return false
    return true
  }

  async function handleCreateBooking() {
    if (!user) {
      navigate('/login')
      return
    }
    // Belt-and-braces alongside the Continue button's disabled state below —
    // a booking must never reach payment without a real, matched vehicle
    // (otherwise the vehicle's fare is silently $0 and only add-ons like a
    // child seat get charged).
    if (!selectedVehicle) {
      setError('Please select a vehicle before continuing to payment.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const extras = selectedAddOns.map((id) => ADD_ONS.find((a) => a.id === id))
      const { booking, client_secret } = await bookingsApi.create({
        vehicle_id: vehicleId,
        pickup: pickup.address,
        dropoff: needsDropoff ? dropoff.address : undefined,
        date,
        time,
        trip_type: tripType,
        service_type: serviceType,
        hours: needsHours ? Number(hours) : undefined,
        flight_number: needsFlightNumber ? flightNumber : undefined,
        stop_addresses: needsDropoff ? stops.map((s) => s.address).filter(Boolean) : [],
        child_seats: childSeats,
        // Price is recalculated server-side from this minute count — never
        // trusted from the client — see routes/bookings.js.
        extra_wait_minutes: extraWaitMinutes,
        passengers,
        suitcases: luggage,
        notes,
        extras,
        distance_km: effectiveDistanceKm,
        duration_min: effectiveDurationMin,
      })
      setClientSecret(client_secret)
      setBookingId(booking?.id ?? null)
      setStep(3)
    } catch (err) {
      setError(err.message || 'Failed to start booking')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePaymentSuccess() {
    // Stripe has already confirmed the charge on their end at this point —
    // this call just verifies it server-side and marks the booking paid so
    // confirmation emails go out. If it fails (e.g. a dropped connection),
    // don't strand the customer on the payment screen: the Stripe webhook
    // is a backup path that will mark the booking paid shortly after, so we
    // still send them on to the success page rather than showing an error
    // for a payment that actually went through.
    if (bookingId) {
      try {
        await bookingsApi.confirm({ booking_id: bookingId })
      } catch (err) {
        console.error('Failed to confirm booking after payment', err)
      }
    }
    clearBookingDraft()
    navigate('/booking/success')
  }

  return (
    <div className="bg-black/[0.02] pb-16">
      <PageMeta title="Book Now" description="Book your BlackStone Chauffeur ride online." />

      {/* Step tracker */}
      <div className="mx-auto max-w-6xl px-4 pt-8 md:px-8">
        <div className="flex flex-col gap-6 border border-black/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                    step === s.id
                      ? 'border-brand-gold text-brand-gold'
                      : step > s.id
                        ? 'border-brand-gold bg-brand-gold text-brand-black'
                        : 'border-black/20 text-black/30'
                  }`}
                >
                  {step > s.id ? <Check size={16} /> : s.id}
                </span>
                <div>
                  <p className={`text-sm font-medium ${step >= s.id ? 'text-black' : 'text-black/40'}`}>{s.label}</p>
                  <p className="text-xs text-black/40">{s.desc}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && <div className="mx-4 hidden h-px flex-1 bg-black/10 sm:block" />}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-8 px-4 md:px-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Main column */}
        <div className="flex min-w-0 flex-col gap-8">
          {step === 1 && (
            <div className="border border-black/10 bg-white p-6 md:p-8">
              <h1 className="font-heading text-2xl text-black">1. Journey Information</h1>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-black/60">Trip Type</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'one_way', label: 'One Way' },
                      { id: 'return', label: 'Return' },
                      { id: 'hourly', label: 'Hourly' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTripType(t.id)}
                        className={`flex-1 border px-4 py-3 text-sm transition-colors ${
                          tripType === t.id
                            ? 'border-brand-gold bg-brand-gold/10 text-brand-black'
                            : 'border-black/15 text-black/60'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-black/60">Airport Transfer</label>
                  <button
                    type="button"
                    onClick={() => setIsAirport((v) => !v)}
                    className={`flex w-full items-center gap-3 border px-4 py-3 text-left text-sm transition-colors ${
                      isAirport ? 'border-brand-gold bg-brand-gold/10 text-brand-black' : 'border-black/15 text-black/60'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        isAirport ? 'border-brand-gold bg-brand-gold' : 'border-black/25'
                      }`}
                    >
                      {isAirport && <Check size={13} className="text-brand-black" />}
                    </span>
                    <Plane size={16} className={isAirport ? 'text-brand-gold' : 'text-black/40'} />
                    This is an airport pickup or drop-off
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-black/60">
                    {needsDropoff ? 'Pickup Location' : 'From'}
                  </label>
                  <PlacesAutocompleteInput
                    isLoaded={mapsLoaded}
                    value={pickup.address}
                    onChange={(val) => setPickup((p) => ({ ...p, address: val }))}
                    onPlaceSelected={setPickup}
                    placeholder="Enter pickup location"
                    className="w-full border border-black/15 px-4 py-3 pr-10 text-sm"
                  />
                </div>

                {needsDropoff && (
                  <div>
                    <label className="mb-2 block text-sm text-black/60">Destination</label>
                    <PlacesAutocompleteInput
                      isLoaded={mapsLoaded}
                      value={dropoff.address}
                      onChange={(val) => setDropoff((d) => ({ ...d, address: val }))}
                      onPlaceSelected={setDropoff}
                      placeholder="Enter destination"
                      className="w-full border border-black/15 px-4 py-3 pr-10 text-sm"
                    />
                  </div>
                )}

                {needsHours && (
                  <div>
                    <label className="mb-2 block text-sm text-black/60">Hours</label>
                    <select
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full border border-black/15 px-4 py-3 text-sm"
                    >
                      <option value="">Select duration</option>
                      {HOURS_OPTIONS.map((h) => (
                        <option key={h} value={h}>{h} hours</option>
                      ))}
                    </select>
                  </div>
                )}

                {needsFlightNumber && (
                  <div>
                    <label className="mb-2 block text-sm text-black/60">Airline Flight Number</label>
                    <input
                      required
                      type="text"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                      placeholder="e.g. NZ103"
                      className="w-full border border-black/15 px-4 py-3 text-sm"
                    />
                    <p className="mt-1 text-xs text-black/40">
                      We track your flight and include 1 hour of free waiting time after it arrives.
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm text-black/60">Date</label>
                  <div className="relative">
                    <input
                      required
                      type="date"
                      min={minBookingDate()}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-black/15 px-4 py-3 pr-10 text-sm"
                    />
                    <Calendar size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/30" />
                  </div>
                  <p className="mt-1 text-xs text-black/40">
                    Bookings must be made at least {MIN_ADVANCE_DAYS} days in advance.
                  </p>
                  {date && !isDateFarEnoughAhead(date) && (
                    <p className="mt-1 text-xs text-red-500">
                      Please choose a date at least {MIN_ADVANCE_DAYS} days from today.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-black/60">Time</label>
                  <div className="relative">
                    <input
                      required
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full border border-black/15 px-4 py-3 pr-10 text-sm"
                    />
                    <Clock size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/30" />
                  </div>
                </div>

              </div>

              {needsDropoff && (
                <div className="mt-6">
                  <label className="mb-2 flex items-center gap-1 text-sm text-black/60">
                    Additional Stops <Info size={12} className="text-black/30" />
                    <span className="ml-auto text-xs font-normal text-black/40">+{formatCurrency(STOP_PRICE)} per stop</span>
                  </label>
                  <div className="flex flex-col gap-3">
                    {stops.map((stop, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 shrink-0 text-xs text-black/40">{i + 1}.</span>
                        <PlacesAutocompleteInput
                          isLoaded={mapsLoaded}
                          value={stop.address}
                          onChange={(val) => updateStopAddress(i, val)}
                          onPlaceSelected={(place) => setStopPlace(i, place)}
                          placeholder={`Stop ${i + 1} address`}
                          className="w-full border border-black/15 px-4 py-3 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeStop(i)}
                          aria-label="Remove stop"
                          className="shrink-0 text-black/40 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {stops.length < STOPS_MAX && (
                    <button
                      type="button"
                      onClick={addStop}
                      className="mt-3 flex items-center gap-1 text-sm text-brand-gold hover:underline"
                    >
                      <Plus size={14} /> Add a stop
                    </button>
                  )}
                </div>
              )}

              <div className="mt-6">
                <label className="mb-2 block text-sm text-black/60">Additional Notes (Optional)</label>
                <textarea
                  maxLength={250}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or additional information…"
                  className="w-full border border-black/15 px-4 py-3 text-sm"
                />
                <p className="mt-1 text-right text-xs text-black/30">{notes.length} / 250</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="min-w-0 border border-black/10 bg-white p-6 md:p-8">
              <h2 className="font-heading text-2xl text-black">2. Select Vehicle</h2>

              {vehicleList.length === 0 && <p className="mt-6 text-sm text-black/50">Loading vehicles…</p>}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {vehicleList.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicleId(String(v.id))}
                    className={`relative border bg-white text-left transition-colors ${
                      String(v.id) === vehicleId ? 'border-brand-gold' : 'border-black/10'
                    }`}
                  >
                    {String(v.id) === vehicleId && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold text-brand-black">
                        <Check size={14} />
                      </span>
                    )}
                    <img src={v.image_url} alt={v.name} className="aspect-[4/3] w-full object-cover" />
                    <div className="p-4">
                      <p className="font-heading text-base text-black">{v.name}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-black/60">
                        <span className="flex items-center gap-1"><Users size={13} /> {v.passengers}</span>
                        <span className="flex items-center gap-1"><Briefcase size={13} /> {v.suitcases}</span>
                        <span className="ml-auto text-black/80">
                          From {formatCurrency(tierPriceForDistance(v.distance_tiers, 16))}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedVehicle && Array.isArray(selectedVehicle.features) && selectedVehicle.features.length > 0 && (
                <p className="mt-6 text-sm text-black/60">
                  <span className="text-black">Included: </span>
                  {selectedVehicle.features.join(', ')}
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm text-black/60">Passengers</label>
                  <div className="flex items-center justify-between border border-black/15 px-4 py-2">
                    <button type="button" onClick={() => setPassengers((p) => Math.max(1, p - 1))} className="px-2 text-lg text-black/50">−</button>
                    <span className="text-sm">{passengers}</span>
                    <button
                      type="button"
                      onClick={() => setPassengers((p) => Math.min(maxPassengers, p + 1))}
                      disabled={passengers >= maxPassengers}
                      className="px-2 text-lg text-black/50 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-black/40">
                    {selectedVehicle ? `Up to ${maxPassengers} for this vehicle` : 'Select a vehicle to raise the limit'}
                  </p>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-1 text-sm text-black/60">
                    Luggage <Info size={12} className="text-black/30" />
                  </label>
                  <div className="flex items-center justify-between border border-black/15 px-4 py-2">
                    <button type="button" onClick={() => setLuggage((l) => Math.max(0, l - 1))} className="px-2 text-lg text-black/50">−</button>
                    <span className="text-sm">{luggage}</span>
                    <button
                      type="button"
                      onClick={() => setLuggage((l) => Math.min(maxLuggage, l + 1))}
                      disabled={luggage >= maxLuggage}
                      className="px-2 text-lg text-black/50 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-black/40">
                    {selectedVehicle ? `Up to ${maxLuggage} for this vehicle` : 'Select a vehicle to raise the limit'}
                  </p>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-1 text-sm text-black/60">
                    Child Seats <Info size={12} className="text-black/30" />
                  </label>
                  <div className="flex items-center justify-between border border-black/15 px-4 py-2">
                    <button type="button" onClick={() => setChildSeats((c) => Math.max(0, c - 1))} className="px-2 text-lg text-black/50">−</button>
                    <span className="text-sm">{childSeats}</span>
                    <button type="button" onClick={() => setChildSeats((c) => Math.min(CHILD_SEAT_MAX, c + 1))} className="px-2 text-lg text-black/50">+</button>
                  </div>
                  <p className="mt-1 text-xs text-black/40">Up to {CHILD_SEAT_MAX}, +{formatCurrency(CHILD_SEAT_PRICE)} each</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <p className="text-sm text-black/70">Add-ons</p>

                {ADD_ONS.map((addOn) => (
                  <label key={addOn.id} className="flex cursor-pointer items-start gap-3 border border-black/15 p-4 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.includes(addOn.id)}
                      onChange={() => toggleAddOn(addOn.id)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-black">{addOn.name} (+{formatCurrency(addOn.price)})</span>
                      <span className="mt-1 block text-xs text-black/50">
                        Priority meet &amp; greet at the closest pickup point to arrivals — the shortest possible
                        walk from your gate to your chauffeur, skipping the general pickup zone.
                      </span>
                    </span>
                  </label>
                ))}

                {/* Extra Wait Time — slider, priced per-minute rather than a
                    flat toggle (see extraWaitPrice() above). */}
                <div className="border border-black/15 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-black">Extra Wait Time</p>
                    <p className="text-sm text-black/70">
                      {extraWaitMinutes > 0 ? `+${formatCurrency(extraWaitCost)}` : 'Not added'}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-black/50">
                    Need your chauffeur to wait longer than the included free time? Slide to add extra
                    minutes (5 to 60) — priced automatically as you go.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={EXTRA_WAIT_MAX_MINUTES}
                      step={EXTRA_WAIT_STEP}
                      value={extraWaitMinutes}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setExtraWaitMinutes(val < EXTRA_WAIT_MIN_MINUTES ? 0 : val)
                      }}
                      className="h-1.5 flex-1 accent-brand-gold"
                    />
                    <span className="w-16 shrink-0 text-right text-sm text-black">
                      {extraWaitMinutes > 0 ? `${extraWaitMinutes} min` : 'Off'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="border border-black/10 bg-white p-6 md:p-8">
              <h2 className="font-heading text-2xl text-black">3. Payment</h2>

              {/* Key terms surfaced up front, before payment — full text at /terms */}
              <div className="mt-6 border border-black/10 bg-black/[0.02] p-5">
                <p className="text-sm font-medium text-black">A few important things before you pay</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {KEY_TERMS.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-black/60">
                      <Info size={14} className="mt-0.5 shrink-0 text-brand-gold" />
                      {point}
                    </li>
                  ))}
                </ul>
                <a href="/terms" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-brand-gold hover:underline">
                  Read the full Terms &amp; Conditions →
                </a>

                <label className="mt-4 flex cursor-pointer items-start gap-2 border-t border-black/10 pt-4 text-sm text-black">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5"
                  />
                  I've read and accept the Terms &amp; Conditions.
                </label>
              </div>

              {!acceptedTerms ? (
                <p className="mt-4 text-sm text-black/50">Accept the terms above to continue to secure payment.</p>
              ) : !clientSecret ? (
                <p className="mt-4 text-sm text-black/60">You will be able to review and pay securely in the next step.</p>
              ) : (
                <div className="mt-6">
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentForm onSuccess={handlePaymentSuccess} />
                  </Elements>
                </div>
              )}

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-black/10 pt-6 text-xs text-black/60 sm:grid-cols-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <ShieldCheck size={20} className="text-brand-gold" />
                  <div>
                    <p className="font-medium text-black">Secure Payments</p>
                    <p>Your payment information is encrypted</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <RotateCcw size={20} className="text-brand-gold" />
                  <div>
                    <p className="font-medium text-black">Free Cancellation</p>
                    <p>Cancel up to 24 hours in advance</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Headphones size={20} className="text-brand-gold" />
                  <div>
                    <p className="font-medium text-black">24/7 Support</p>
                    <p>We're here to help anytime</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <BadgeDollarSign size={20} className="text-brand-gold" />
                  <div>
                    <p className="font-medium text-black">Best Price Guarantee</p>
                    <p>Premium service at the best value</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="overflow-hidden border border-black/10 bg-white">
            <RouteMap
              isLoaded={mapsLoaded}
              origin={pickup.lat ? pickup : null}
              destination={needsDropoff && dropoff.lat ? dropoff : null}
              waypoints={needsDropoff ? stops : null}
              onRouteCalculated={setRoute}
            />
          </div>

          {(pickup.address || dropoff.address) && (
            <div className="border border-black/10 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-heading text-base text-black">Journey Summary</p>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-brand-gold hover:underline">Edit</button>
              </div>
              <dl className="flex flex-col gap-2 text-sm">
                {pickup.address && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-black/50">Pickup</dt>
                    <dd className="text-right text-black">{pickup.address}</dd>
                  </div>
                )}
                {needsDropoff && dropoff.address && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-black/50">Destination</dt>
                    <dd className="text-right text-black">{dropoff.address}</dd>
                  </div>
                )}
                {needsDropoff && route && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-black/50">Distance</dt>
                    <dd className="text-black">{route.distanceKm} km · ~{route.durationMin} min</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4"><dt className="text-black/50">Trip Type</dt><dd className="text-black">{tripType === 'one_way' ? 'One Way' : tripType === 'return' ? 'Return' : 'Hourly'}</dd></div>
                {date && <div className="flex justify-between gap-4"><dt className="text-black/50">Date</dt><dd className="text-black">{date}</dd></div>}
                {time && <div className="flex justify-between gap-4"><dt className="text-black/50">Time</dt><dd className="text-black">{time}</dd></div>}
                {needsHours && hours && <div className="flex justify-between gap-4"><dt className="text-black/50">Duration</dt><dd className="text-black">{hours} hours</dd></div>}
                <div className="flex justify-between gap-4"><dt className="text-black/50">Passengers</dt><dd className="text-black">{passengers}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-black/50">Luggage</dt><dd className="text-black">{luggage}</dd></div>
                {childSeats > 0 && <div className="flex justify-between gap-4"><dt className="text-black/50">Child Seats</dt><dd className="text-black">{childSeats}</dd></div>}
                {needsDropoff && stops.length > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-black/50">Stops</dt>
                    <dd className="text-right text-black">
                      {stops.map((s, i) => <div key={i}>{s.address || `Stop ${i + 1} (no address yet)`}</div>)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4"><dt className="text-black/50">Service Type</dt><dd className="text-black">{serviceType}</dd></div>
                {needsFlightNumber && flightNumber && <div className="flex justify-between gap-4"><dt className="text-black/50">Flight No.</dt><dd className="text-black">{flightNumber}</dd></div>}
              </dl>
            </div>
          )}

          {selectedVehicle && (
            <div className="border border-black/10 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-heading text-base text-black">Selected Vehicle</p>
                <button type="button" onClick={() => setStep(2)} className="text-xs text-brand-gold hover:underline">Edit</button>
              </div>
              <div className="flex items-center gap-3">
                <img src={selectedVehicle.image_url} alt={selectedVehicle.name} className="h-14 w-20 rounded object-cover" />
                <div className="flex-1">
                  <p className="text-sm text-black">{selectedVehicle.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-black/50">
                    <span className="flex items-center gap-1"><Users size={12} /> {selectedVehicle.passengers}</span>
                    <span className="flex items-center gap-1"><Briefcase size={12} /> {selectedVehicle.suitcases}</span>
                    <span className="ml-auto">From {formatCurrency(tierPriceForDistance(selectedVehicle.distance_tiers, 16))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedVehicle && (needsDropoff ? route : needsHours ? hours : true) && (
            <div className="border border-black/10 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-heading text-base text-black">Price Estimate</p>
                <p className="text-xs text-black/40">All prices in NZD</p>
              </div>
              <dl className="flex flex-col gap-2 text-sm">
                {needsDropoff ? (
                  <div className="flex justify-between"><dt className="text-black/60">Base Fare</dt><dd className="text-black">{formatCurrency(baseFare)}</dd></div>
                ) : needsHours ? (
                  <div className="flex justify-between"><dt className="text-black/60">Hourly Rate ({hours || 0} hrs)</dt><dd className="text-black">{formatCurrency((Number(selectedVehicle.price_per_minute) || 0) * Number(hours || 0) * 60)}</dd></div>
                ) : (
                  <div className="flex justify-between"><dt className="text-black/60">Flat Rate</dt><dd className="text-black">{formatCurrency(Number(selectedVehicle.starting_price) || 0)}</dd></div>
                )}
                {selectedAddOns.map((id) => {
                  const addOn = ADD_ONS.find((a) => a.id === id)
                  return addOn ? (
                    <div key={id} className="flex justify-between"><dt className="text-black/60">{addOn.name}</dt><dd className="text-black">{formatCurrency(addOn.price)}</dd></div>
                  ) : null
                })}
                {childSeats > 0 && (
                  <div className="flex justify-between"><dt className="text-black/60">Child Seats ({childSeats})</dt><dd className="text-black">{formatCurrency(childSeats * CHILD_SEAT_PRICE)}</dd></div>
                )}
                {stopCount > 0 && (
                  <div className="flex justify-between"><dt className="text-black/60">Additional Stops ({stopCount})</dt><dd className="text-black">{formatCurrency(stopCount * STOP_PRICE)}</dd></div>
                )}
                {extraWaitMinutes > 0 && (
                  <div className="flex justify-between"><dt className="text-black/60">Extra Wait Time ({extraWaitMinutes} min)</dt><dd className="text-black">{formatCurrency(extraWaitCost)}</dd></div>
                )}
              </dl>
              <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                <span className="font-heading text-black">Total (Incl. GST)</span>
                <span className="font-heading text-xl text-brand-gold">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 border border-black/10 bg-white p-5">
            <Clock size={20} className="mt-0.5 shrink-0 text-brand-gold" />
            <div>
              <p className="text-sm font-medium text-black">Free Waiting Time</p>
              <p className="mt-1 text-xs text-black/50">
                We include 1 hour of free waiting time after your plane has arrived for airport pickups, and 15 minutes for all other bookings.
              </p>
            </div>
          </div>

          {error && step < 3 && (
            <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}

          {step < 3 && (
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center justify-center gap-2 border border-black/15 px-5 py-3 text-sm font-medium text-black transition-colors hover:border-black/30"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}
              <button
                type="button"
                disabled={(step === 1 && !goToStep1Valid()) || (step === 2 && (!selectedVehicle || submitting))}
                onClick={() => {
                  if (step === 1) setStep(2)
                  else handleCreateBooking()
                }}
                className="flex flex-1 items-center justify-center gap-2 bg-brand-gold px-6 py-3 text-sm font-medium text-brand-black transition-colors hover:bg-brand-champagne disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === 1 ? 'Continue to Select Vehicle' : submitting ? 'Preparing payment…' : 'Continue to Payment'}
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center justify-center gap-2 border border-black/15 px-5 py-3 text-sm font-medium text-black transition-colors hover:border-black/30"
            >
              <ArrowLeft size={16} />
              Back to Select Vehicle
            </button>
          )}

          {!user && step < 3 && (
            <p className="text-center text-xs text-black/40">You'll need to log in or register to complete your booking.</p>
          )}
        </div>
      </div>
    </div>
  )
}
