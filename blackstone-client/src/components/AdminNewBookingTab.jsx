import { useEffect, useMemo, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import { Download, Wand2, AlertTriangle, Plus, X, Info } from 'lucide-react'
import Button from './Button'
import PlacesAutocompleteInput from './PlacesAutocompleteInput'
import RouteMap from './RouteMap'
import { vehicles as vehiclesApi, bookings as bookingsApi } from '../utils/api'
import { formatCurrency } from '../utils/helpers'
import { calculateFare, tierPriceForDistance } from '../utils/pricing'
import { useAuth } from '../context/AuthContext'
// Note: unlike the customer-facing Booking.jsx, admin-created bookings have
// no minimum-advance-days restriction — staff can book last-minute or
// same-day rides on a client's behalf. bookingRules.js is intentionally not
// used here.

const GOOGLE_MAPS_LIBRARIES = ['places']
const HAS_MAPS_KEY = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)

// Flat, one-time toggle add-ons — mirrors Booking.jsx and db/schema.sql.
const ADD_ONS = [
  { id: 'Extra Wait Time', name: 'Extra Wait Time', price: 20 },
  { id: 'VIP Airport Pickup', name: 'VIP Airport Pickup', price: 30 },
]

// Quantity-based add-ons, priced per unit rather than a flat toggle.
const CHILD_SEAT_PRICE = 15
const CHILD_SEAT_MAX = 2
const STOP_PRICE = 20
const STOPS_MAX = 5

// Mirrors Booking.jsx and the server — Trip Type (One Way / Return / Hourly)
// drives dropoff/hours; Service Type is now just a two-value classification.
const HOURS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 10, 12]
const TRIP_TYPES = [
  { id: 'one_way', label: 'One Way' },
  { id: 'return', label: 'Return' },
  { id: 'hourly', label: 'Hourly' },
]
const SERVICE_TYPES = ['Chauffeur Service', 'Airport Transfer']

function AdminNewBookingWithMapsLoader({ onCreated }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })
  return <AdminNewBookingForm mapsLoaded={isLoaded} onCreated={onCreated} />
}

export default function AdminNewBookingTab({ onCreated }) {
  return HAS_MAPS_KEY ? (
    <AdminNewBookingWithMapsLoader onCreated={onCreated} />
  ) : (
    <AdminNewBookingForm mapsLoaded={false} onCreated={onCreated} />
  )
}

function AdminNewBookingForm({ mapsLoaded, onCreated }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'second_admin'

  const [vehicleList, setVehicleList] = useState([])
  // Admin/second_admin only — a provider hitting this same form always
  // owns their own bookings, so these two never apply to them.
  const [providerList, setProviderList] = useState([])
  const [driverList, setDriverList] = useState([])
  const [providerId, setProviderId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [driverPrice, setDriverPrice] = useState('')

  const [whatsappText, setWhatsappText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseWarnings, setParseWarnings] = useState([])
  const [parsed, setParsed] = useState(false)

  const [tripType, setTripType] = useState('one_way')
  const [serviceType, setServiceType] = useState('Chauffeur Service')
  const [passengerName, setPassengerName] = useState('')
  const [passengerPhone, setPassengerPhone] = useState('')
  const [passengerEmail, setPassengerEmail] = useState('')
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null })
  const [dropoff, setDropoff] = useState({ address: '', lat: null, lng: null })
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [hours, setHours] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  // Each stop is { address, lat, lng } — same shape as pickup/dropoff — so
  // it can be routed as a Directions waypoint once resolved via autocomplete.
  const [stops, setStops] = useState([])
  const [passengers, setPassengers] = useState(1)
  const [luggage, setLuggage] = useState(0)
  const [childSeats, setChildSeats] = useState(0)
  const [notes, setNotes] = useState('')
  const [reference, setReference] = useState('')
  const [route, setRoute] = useState(null)
  const [vehicleId, setVehicleId] = useState('')
  const [selectedAddOns, setSelectedAddOns] = useState([])
  // The price is entered/edited on every booking — it's no longer purely
  // auto-calculated. `total` below still estimates a starting point once
  // enough trip details are filled in, but `priceTouched` stops that
  // estimate from overwriting a value that's already been typed in.
  const [manualPrice, setManualPrice] = useState('')
  const [priceTouched, setPriceTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    vehiclesApi.list().then(setVehicleList).catch(() => setVehicleList([]))
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    bookingsApi.providers().then(setProviderList).catch(() => setProviderList([]))
    bookingsApi.drivers().then(setDriverList).catch(() => setDriverList([]))
  }, [isAdmin])

  const needsDropoff = tripType !== 'hourly'
  const needsHours = tripType === 'hourly'
  const needsFlightNumber = serviceType === 'Airport Transfer'
  const effectiveDistanceKm = needsDropoff ? route?.distanceKm : undefined
  const effectiveDurationMin = needsHours ? Number(hours || 0) * 60 : needsDropoff ? route?.durationMin : 0

  const selectedVehicle = vehicleList.find((v) => String(v.id) === String(vehicleId))

  // Vehicle is picked from a plain dropdown here — it's a quick-reference
  // label for what the client will ride in, not something that drives
  // pricing or passenger/luggage limits (see the manual price field below).
  const MAX_PASSENGERS = 20
  const MAX_LUGGAGE = 20

  const flatAddOnsTotal = selectedAddOns.reduce((sum, id) => {
    const addOn = ADD_ONS.find((a) => a.id === id)
    return sum + (addOn ? addOn.price : 0)
  }, 0)
  const stopCount = needsDropoff ? stops.length : 0
  const quantityAddOnsTotal = childSeats * CHILD_SEAT_PRICE + stopCount * STOP_PRICE
  const addOnsTotal = flatAddOnsTotal + quantityAddOnsTotal

  const baseFare = useMemo(
    () => (selectedVehicle && needsDropoff && route ? tierPriceForDistance(selectedVehicle.distance_tiers, route.distanceKm) : 0),
    [selectedVehicle, route, needsDropoff],
  )

  const total = useMemo(
    () =>
      selectedVehicle
        ? calculateFare({
            vehicle: selectedVehicle,
            distanceKm: effectiveDistanceKm,
            durationMin: effectiveDurationMin,
            addOnsTotal,
          })
        : 0,
    [selectedVehicle, effectiveDistanceKm, effectiveDurationMin, addOnsTotal],
  )

  // Suggests a starting price once there's enough to estimate from, but only
  // until it's actually edited — after that, the typed number is the source
  // of truth for this booking.
  useEffect(() => {
    if (!priceTouched && total > 0) setManualPrice(String(total))
  }, [total, priceTouched])

  function handleManualPriceChange(value) {
    setPriceTouched(true)
    setManualPrice(value)
  }

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

  // Sends the pasted WhatsApp text to the server-side heuristic parser and
  // fills in whatever it could confidently detect. Nothing is created yet —
  // every field below stays editable so a bad guess is easy to fix before
  // hitting "Create Booking".
  async function handleParse() {
    if (!whatsappText.trim()) return
    setParsing(true)
    setError('')
    try {
      const result = await bookingsApi.parseWhatsapp(whatsappText)
      if (result.trip_type) setTripType(result.trip_type)
      if (result.service_type) setServiceType(result.service_type)
      if (result.passenger_name) setPassengerName(result.passenger_name)
      if (result.passenger_phone) setPassengerPhone(result.passenger_phone)
      if (result.passenger_email) setPassengerEmail(result.passenger_email)
      if (result.pickup) setPickup({ address: result.pickup, lat: null, lng: null })
      if (result.dropoff) setDropoff({ address: result.dropoff, lat: null, lng: null })
      if (result.date) setDate(result.date)
      if (result.time) setTime(result.time)
      if (result.hours) setHours(String(result.hours))
      if (result.flight_number) setFlightNumber(result.flight_number)
      if (result.passengers) setPassengers(Math.min(MAX_PASSENGERS, Math.max(1, result.passengers)))
      if (result.suitcases != null) setLuggage(Math.min(MAX_LUGGAGE, Math.max(0, result.suitcases)))
      if (result.vehicle_id) setVehicleId(String(result.vehicle_id))
      // Reference number has no dedicated field on the booking — fold it
      // into Notes (clearly labelled) alongside any detected note text so
      // it isn't lost, and stays visible/editable before the booking is
      // created.
      const noteParts = []
      if (result.reference_number) noteParts.push(`Reference: ${result.reference_number}`)
      if (result.notes) noteParts.push(result.notes)
      if (noteParts.length) setNotes(noteParts.join('\n').slice(0, 250))
      setParseWarnings(result.warnings || [])
      setParsed(true)
    } catch (err) {
      setError(err.message || 'Failed to parse text')
    } finally {
      setParsing(false)
    }
  }

  // Price is optional — a booking can be created before the rate is
  // settled and filled in later. If something was typed, it still has to
  // be a valid non-negative number.
  const priceValue = manualPrice === '' ? 0 : Number(manualPrice)
  const priceValid = manualPrice === '' || (Number.isFinite(priceValue) && priceValue >= 0)

  const canSubmit =
    passengerName &&
    pickup.address &&
    (!needsDropoff || dropoff.address) &&
    (!needsHours || hours) &&
    date &&
    time &&
    vehicleId &&
    priceValid

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    setSuccess(null)
    try {
      const extras = selectedAddOns.map((id) => ADD_ONS.find((a) => a.id === id))
      const { booking } = await bookingsApi.createProvider({
        vehicle_id: vehicleId,
        passenger_name: passengerName,
        passenger_phone: passengerPhone,
        passenger_email: passengerEmail,
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
        passengers,
        suitcases: luggage,
        notes,
        reference: reference || undefined,
        extras,
        distance_km: effectiveDistanceKm,
        duration_min: effectiveDurationMin,
        total_price: priceValue,
        // All optional — omitted entirely for a plain provider account,
        // which the server would ignore from them anyway.
        provider_id: isAdmin && providerId ? providerId : undefined,
        driver_id: isAdmin && driverId ? driverId : undefined,
        driver_price: isAdmin && driverId && driverPrice !== '' ? driverPrice : undefined,
      })
      setSuccess(booking)
      onCreated?.()
      // Reset everything for the next booking.
      setWhatsappText('')
      setParseWarnings([])
      setParsed(false)
      setTripType('one_way')
      setServiceType('Chauffeur Service')
      setPassengerName('')
      setPassengerPhone('')
      setPassengerEmail('')
      setPickup({ address: '', lat: null, lng: null })
      setDropoff({ address: '', lat: null, lng: null })
      setDate('')
      setTime('')
      setHours('')
      setFlightNumber('')
      setStops([])
      setPassengers(1)
      setLuggage(0)
      setChildSeats(0)
      setNotes('')
      setReference('')
      setVehicleId('')
      setSelectedAddOns([])
      setRoute(null)
      setManualPrice('')
      setPriceTouched(false)
      setProviderId('')
      setDriverId('')
      setDriverPrice('')
    } catch (err) {
      setError(err.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      {success && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-green-600/30 bg-green-50 px-5 py-4">
          <p className="text-sm text-green-700">
            Booking #{success.id} created for {success.passenger_name} — {formatCurrency(success.total_price)}.
          </p>
          <button
            onClick={() => bookingsApi.downloadInvoice(success.id)}
            className="flex items-center gap-1 text-xs text-green-700 underline"
          >
            <Download size={12} /> Download invoice
          </button>
        </div>
      )}

      {/* Paste-from-WhatsApp box */}
      <div className="mb-8 border border-black/10 bg-white p-6 md:p-8">
        <h2 className="flex items-center gap-2 font-heading text-xl text-black">
          <Wand2 size={18} className="text-brand-gold" /> Paste from WhatsApp
        </h2>
        <p className="mt-1 text-sm text-black/50">
          Paste the raw message a client sent you and it'll try to fill in the form below — check every field
          before creating the booking.
        </p>
        <textarea
          rows={4}
          value={whatsappText}
          onChange={(e) => setWhatsappText(e.target.value)}
          placeholder={'e.g. "Hi, need a pickup from Auckland Airport to Sky City on 25/07 at 3pm, John Smith, 021 234 5678, wedding car"'}
          className="mt-4 w-full border border-black/15 px-4 py-3 text-sm"
        />
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" onClick={handleParse} disabled={!whatsappText.trim() || parsing}>
            {parsing ? 'Parsing…' : 'Parse & Autofill'}
          </Button>
          {parsed && parseWarnings.length === 0 && (
            <span className="text-xs text-green-700">All fields detected — please double-check them anyway.</span>
          )}
        </div>
        {parseWarnings.length > 0 && (
          <div className="mt-3 flex flex-col gap-1 border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {parseWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="border border-black/10 bg-white p-6 md:p-8">
            <h1 className="font-heading text-2xl text-black">New Booking</h1>
            <p className="mt-1 text-sm text-black/50">Enter the client's trip details. No payment is taken now — it's invoiced.</p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-black/60">Trip Type</label>
                <div className="flex gap-2">
                  {TRIP_TYPES.map((t) => (
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
                <label className="mb-2 block text-sm text-black/60">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full border border-black/15 px-4 py-3 text-sm"
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-black/60">Passenger Name</label>
                <input
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Client's full name"
                  className="w-full border border-black/15 px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-black/60">Passenger Phone</label>
                <input
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  placeholder="Client's phone number"
                  className="w-full border border-black/15 px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-black/60">Passenger Email (optional)</label>
                <input
                  type="email"
                  value={passengerEmail}
                  onChange={(e) => setPassengerEmail(e.target.value)}
                  placeholder="Client's email"
                  className="w-full border border-black/15 px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-black/60">{needsDropoff ? 'Pickup Location' : 'From'}</label>
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
              <div>
                <label className="mb-2 block text-sm text-black/60">Date</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-black/15 px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-black/60">Time</label>
                <input
                  required
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-black/15 px-4 py-3 text-sm"
                />
              </div>
              {needsHours && (
                <div>
                  <label className="mb-2 block text-sm text-black/60">Hours</label>
                  <select
                    required
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
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="e.g. NZ103"
                    className="w-full border border-black/15 px-4 py-3 text-sm"
                  />
                </div>
              )}
            </div>

            {needsDropoff && (
              <div className="mt-6">
                <label className="mb-2 flex items-center gap-1 text-sm text-black/60">
                  Additional Stops
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
          </div>

          <div className="border border-black/10 bg-white p-6 md:p-8">
            <h2 className="font-heading text-xl text-black">Vehicle</h2>
            <p className="mt-1 text-sm text-black/50">Quick reference only — it doesn't affect the price, just records what the client rides in.</p>
            <div className="mt-4">
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full border border-black/15 px-4 py-3 text-sm"
              >
                <option value="">
                  {vehicleList.length === 0 ? 'Loading vehicles…' : 'Select a vehicle'}
                </option>
                {vehicleList.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-black/60">Passengers</label>
                <div className="flex items-center justify-between border border-black/15 px-4 py-2">
                  <button type="button" onClick={() => setPassengers((p) => Math.max(1, p - 1))} className="px-2 text-lg text-black/50">−</button>
                  <span className="text-sm">{passengers}</span>
                  <button
                    type="button"
                    onClick={() => setPassengers((p) => Math.min(MAX_PASSENGERS, p + 1))}
                    disabled={passengers >= MAX_PASSENGERS}
                    className="px-2 text-lg text-black/50 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
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
                    onClick={() => setLuggage((l) => Math.min(MAX_LUGGAGE, l + 1))}
                    disabled={luggage >= MAX_LUGGAGE}
                    className="px-2 text-lg text-black/50 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1 text-sm text-black/60">Child Seats</label>
                <div className="flex items-center justify-between border border-black/15 px-4 py-2">
                  <button type="button" onClick={() => setChildSeats((c) => Math.max(0, c - 1))} className="px-2 text-lg text-black/50">−</button>
                  <span className="text-sm">{childSeats}</span>
                  <button type="button" onClick={() => setChildSeats((c) => Math.min(CHILD_SEAT_MAX, c + 1))} className="px-2 text-lg text-black/50">+</button>
                </div>
                <p className="mt-1 text-xs text-black/40">Up to {CHILD_SEAT_MAX}, +{formatCurrency(CHILD_SEAT_PRICE)} each</p>
              </div>
            </div>

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

            <div className="mt-6">
              <p className="mb-2 text-sm text-black/70">Add-ons</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ADD_ONS.map((addOn) => (
                  <label key={addOn.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedAddOns.includes(addOn.id)} onChange={() => toggleAddOn(addOn.id)} />
                    {addOn.name} (+{formatCurrency(addOn.price)})
                  </label>
                ))}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="border border-black/10 bg-white p-6 md:p-8">
              <h2 className="font-heading text-xl text-black">Attribution & Dispatch</h2>
              <p className="mt-1 text-sm text-black/50">All optional — leave any of these blank and set them later.</p>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-black/60">Reference</label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="A booking or PO number, or any tag for your own records"
                    className="w-full border border-black/15 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-black/60">Attribute to Provider</label>
                  <select
                    value={providerId}
                    onChange={(e) => setProviderId(e.target.value)}
                    className="w-full border border-black/15 px-4 py-3 text-sm"
                  >
                    <option value="">None — this is a direct admin booking</option>
                    {providerList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-black/40">
                    Logs this booking as the chosen provider's own, instead of yours.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-black/60">Assign Driver</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full border border-black/15 px-4 py-3 text-sm"
                  >
                    <option value="">Not yet — assign later</option>
                    {driverList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {driverId && (
                  <div>
                    <label className="mb-2 block text-sm text-black/60">Driver Price</label>
                    <div className="flex items-center border border-black/15 px-4 py-2">
                      <span className="mr-1 text-black/40">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={driverPrice}
                        onChange={(e) => setDriverPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full text-sm outline-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-black/40">
                      What this driver gets paid for the ride — separate from the customer's total, and only ever shown to them.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:h-fit">
          {needsDropoff && (
            <div className="overflow-hidden border border-black/10 bg-white">
              <RouteMap
                isLoaded={mapsLoaded}
                origin={pickup.lat ? pickup : null}
                destination={dropoff.lat ? dropoff : null}
                waypoints={stops}
                onRouteCalculated={setRoute}
              />
            </div>
          )}

          {needsDropoff && route && (
            <div className="border border-black/10 bg-white p-5 text-sm text-black/70">
              Distance: {route.distanceKm} km · ~{route.durationMin} min
            </div>
          )}

          <div className="border border-black/10 bg-white p-5">
            <p className="mb-3 font-heading text-base text-black">Price</p>

            {selectedVehicle && (needsDropoff ? route : needsHours ? hours : true) && (
              <dl className="mb-3 flex flex-col gap-2 border-b border-black/10 pb-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-black/60">{needsDropoff ? 'Base Fare' : needsHours ? 'Hourly Rate' : 'Flat Rate'}</dt>
                  <dd className="text-black">
                    {formatCurrency(needsDropoff ? baseFare : total - addOnsTotal)}
                  </dd>
                </div>
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
                <div className="flex justify-between text-xs text-black/40">
                  <dt>Suggested total</dt>
                  <dd>{formatCurrency(total)}</dd>
                </div>
              </dl>
            )}

            <label className="mb-2 block text-sm text-black/60">Total Price (optional)</label>
            <div className="flex items-center border border-black/15 px-4 py-2">
              <span className="mr-1 text-black/40">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualPrice}
                onChange={(e) => handleManualPriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full text-lg text-brand-gold outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-black/40">
              This is the price the client will be invoiced — leave blank if the rate isn't settled yet, and edit it later from the booking's detail view.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={!canSubmit || submitting}>
            {submitting ? 'Creating booking…' : 'Create Booking'}
          </Button>
        </div>
      </form>
    </section>
  )
}
