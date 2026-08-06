import { useState } from 'react'
import { Pencil } from 'lucide-react'
import Modal from './Modal'
import StatusBadge from './StatusBadge'
import { bookings as bookingsApi, vehicles as vehiclesApi } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'

const TRIP_TYPE_LABELS = { one_way: 'One Way', return: 'Return', hourly: 'Hourly' }
const TRIP_TYPES = [
  { id: 'one_way', label: 'One Way' },
  { id: 'return', label: 'Return' },
  { id: 'hourly', label: 'Hourly' },
]
const SERVICE_TYPES = ['Chauffeur Service', 'Airport Transfer']
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded']
const CHILD_SEAT_MAX = 2
const MAX_PASSENGERS = 20
const MAX_LUGGAGE = 20

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <dt className="text-black/50">{label}</dt>
      <dd className="text-right text-black">{value}</dd>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="border-t border-black/10 pt-4 first:border-t-0 first:pt-0">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-black/40">{title}</p>
      <dl>{children}</dl>
    </div>
  )
}

// Labelled input/select/textarea used only in edit mode — a thin wrapper so
// every editable row shares the same label + spacing without repeating it.
function EditRow({ label, children }) {
  return (
    <div className="py-1.5">
      <label className="mb-1 block text-xs text-black/50">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full border border-black/15 px-3 py-2 text-sm'

// Full-detail popup for a single booking — every relevant column from the
// bookings table (plus joined vehicle/customer names), so the underlying
// table row can stay short and this is where "show me everything" lives.
// `actions` is an optional slot for whatever action controls the caller
// wants (assign driver, cancel, delete, invoice, calendar) — kept as
// caller-supplied JSX so this component doesn't duplicate that logic.
// `onUpdated` is called after the payment status is changed here (or after
// an edit is saved), so the caller can refresh its list (e.g.
// SecondAdminDashboard's load()).
//
// Edit mode: admin/second_admin can edit most fields on a booking —
// contact info, trip details, vehicle (reference), passenger/luggage/child
// seat counts, notes, and — deliberately, unlike the customer-facing
// booking flow — the total price itself, for correcting a mistake or
// adjusting a negotiated fare after the fact.
export default function BookingDetailsModal({ booking, drivers = [], onClose, actions, onUpdated }) {
  const [savingPayment, setSavingPayment] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [vehicleList, setVehicleList] = useState([])
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  if (!booking) return null

  const passengerName = booking.passenger_name || booking.customer_name || '—'
  const passengerEmail = booking.passenger_email || booking.customer_email || '—'
  const driver = drivers.find((d) => String(d.id) === String(booking.driver_id))
  const stopAddresses = Array.isArray(booking.stop_addresses) ? booking.stop_addresses : []
  const extras = Array.isArray(booking.extras) ? booking.extras : []

  async function handlePaymentStatusChange(e) {
    const status = e.target.value
    setSavingPayment(true)
    try {
      await bookingsApi.setPaymentStatus(booking.id, status)
      onUpdated?.()
    } catch (err) {
      window.alert(err.message || 'Failed to update payment status')
    } finally {
      setSavingPayment(false)
    }
  }

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function startEdit() {
    if (!vehiclesLoaded) {
      vehiclesApi
        .list()
        .then(setVehicleList)
        .catch(() => setVehicleList([]))
        .finally(() => setVehiclesLoaded(true))
    }
    setForm({
      passenger_name: booking.passenger_name || booking.customer_name || '',
      passenger_phone: booking.passenger_phone || '',
      passenger_email: booking.passenger_email || booking.customer_email || '',
      pickup: booking.pickup || '',
      dropoff: booking.dropoff || '',
      date: String(booking.date || '').slice(0, 10),
      time: String(booking.time || '').slice(0, 5),
      trip_type: booking.trip_type || 'one_way',
      service_type: booking.service_type || 'Chauffeur Service',
      hours: booking.hours != null ? String(booking.hours) : '',
      flight_number: booking.flight_number || '',
      stop_addresses: stopAddresses.join('\n'),
      vehicle_id: booking.vehicle_id != null ? String(booking.vehicle_id) : '',
      passengers: booking.passengers != null ? String(booking.passengers) : '1',
      suitcases: booking.suitcases != null ? String(booking.suitcases) : '0',
      child_seats: booking.child_seats != null ? String(booking.child_seats) : '0',
      notes: booking.notes || '',
      total_price: booking.total_price != null ? String(booking.total_price) : '',
    })
    setSaveError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setForm(null)
    setSaveError('')
  }

  const needsDropoff = form?.trip_type !== 'hourly'
  const needsHours = form?.trip_type === 'hourly'
  const needsFlightNumber = form?.service_type === 'Airport Transfer'

  const priceValue = Number(form?.total_price)
  const priceValid = form?.total_price !== '' && Number.isFinite(priceValue) && priceValue > 0
  const canSave =
    form &&
    form.passenger_name.trim() &&
    form.pickup.trim() &&
    (!needsDropoff || form.dropoff.trim()) &&
    (!needsHours || form.hours) &&
    form.date &&
    form.time &&
    form.vehicle_id &&
    priceValid

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setSaveError('')
    try {
      const payload = {
        passenger_name: form.passenger_name.trim(),
        passenger_phone: form.passenger_phone.trim() || null,
        passenger_email: form.passenger_email.trim() || null,
        pickup: form.pickup.trim(),
        dropoff: needsDropoff ? form.dropoff.trim() : null,
        date: form.date,
        time: form.time,
        trip_type: form.trip_type,
        service_type: form.service_type,
        hours: needsHours ? Number(form.hours) : null,
        flight_number: needsFlightNumber ? form.flight_number.trim() || null : null,
        stop_addresses: needsDropoff
          ? form.stop_addresses.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        vehicle_id: form.vehicle_id,
        passengers: Number(form.passengers),
        suitcases: Number(form.suitcases),
        child_seats: Number(form.child_seats),
        notes: form.notes,
        total_price: priceValue,
      }
      await bookingsApi.updateDetails(booking.id, payload)
      onUpdated?.()
      setEditing(false)
      setForm(null)
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={Boolean(booking)} onClose={onClose} title={`Booking #${booking.id}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={booking.booking_status} />
            <label className="flex items-center gap-1.5 text-xs text-black/60">
              Payment:
              <select
                value={booking.payment_status}
                onChange={handlePaymentStatusChange}
                disabled={savingPayment || editing}
                className="rounded-full border border-black/15 bg-white px-2.5 py-1 text-xs capitalize text-black/80 disabled:opacity-40"
              >
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              className="flex items-center gap-1 text-xs text-brand-gold hover:underline"
            >
              <Pencil size={12} /> Edit booking
            </button>
          )}
        </div>

        {!editing ? (
          <>
            <Section title="Passenger">
              <Field label="Name" value={passengerName} />
              <Field label="Email" value={passengerEmail} />
              <Field label="Phone" value={booking.passenger_phone} />
            </Section>

            <Section title="Trip">
              <Field label="Pickup" value={booking.pickup} />
              <Field label="Destination" value={booking.dropoff} />
              {stopAddresses.length > 0 && (
                <Field label="Stops" value={stopAddresses.join(', ')} />
              )}
              <Field label="Date" value={formatDate(booking.date)} />
              <Field label="Time" value={String(booking.time || '').slice(0, 5)} />
              <Field label="Trip Type" value={TRIP_TYPE_LABELS[booking.trip_type] || booking.trip_type} />
              <Field label="Service Type" value={booking.service_type} />
              {booking.hours ? <Field label="Hours" value={`${booking.hours} hrs`} /> : null}
              {booking.flight_number ? <Field label="Flight Number" value={booking.flight_number} /> : null}
              {booking.distance_km ? <Field label="Distance" value={`${booking.distance_km} km`} /> : null}
              {booking.duration_min ? <Field label="Duration" value={`${booking.duration_min} min`} /> : null}
            </Section>

            <Section title="Vehicle & Party">
              <Field label="Vehicle" value={booking.vehicle_name} />
              <Field label="Passengers" value={booking.passengers || null} />
              <Field label="Luggage" value={booking.suitcases || null} />
              <Field label="Child Seats" value={booking.child_seats || null} />
              <Field label="Driver" value={driver?.name || (booking.driver_id ? `#${booking.driver_id}` : 'Unassigned')} />
            </Section>

            {extras.length > 0 && (
              <Section title="Add-ons">
                {extras.map((e, i) => (
                  <Field key={i} label={e.name} value={formatCurrency(e.price)} />
                ))}
              </Section>
            )}

            {booking.notes && (
              <Section title="Notes">
                <p className="text-sm text-black">{booking.notes}</p>
              </Section>
            )}

            <Section title="Total & Booked">
              <Field label="Total Price" value={formatCurrency(booking.total_price)} />
              <Field label="Booked On" value={booking.created_at ? formatDate(booking.created_at) : null} />
            </Section>

            {actions && (
              <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-4">{actions}</div>
            )}
          </>
        ) : (
          <>
            <Section title="Passenger">
              <EditRow label="Name">
                <input className={inputClass} value={form.passenger_name} onChange={(e) => set('passenger_name', e.target.value)} />
              </EditRow>
              <EditRow label="Phone">
                <input className={inputClass} value={form.passenger_phone} onChange={(e) => set('passenger_phone', e.target.value)} />
              </EditRow>
              <EditRow label="Email">
                <input type="email" className={inputClass} value={form.passenger_email} onChange={(e) => set('passenger_email', e.target.value)} />
              </EditRow>
            </Section>

            <Section title="Trip">
              <EditRow label="Pickup">
                <input className={inputClass} value={form.pickup} onChange={(e) => set('pickup', e.target.value)} />
              </EditRow>
              <EditRow label="Trip Type">
                <div className="flex gap-2">
                  {TRIP_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set('trip_type', t.id)}
                      className={`flex-1 border px-3 py-2 text-xs transition-colors ${
                        form.trip_type === t.id ? 'border-brand-gold bg-brand-gold/10 text-brand-black' : 'border-black/15 text-black/60'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </EditRow>
              {needsDropoff && (
                <EditRow label="Destination">
                  <input className={inputClass} value={form.dropoff} onChange={(e) => set('dropoff', e.target.value)} />
                </EditRow>
              )}
              {needsDropoff && (
                <EditRow label="Stops (one per line)">
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={form.stop_addresses}
                    onChange={(e) => set('stop_addresses', e.target.value)}
                  />
                </EditRow>
              )}
              <div className="grid grid-cols-2 gap-3">
                <EditRow label="Date">
                  <input type="date" className={inputClass} value={form.date} onChange={(e) => set('date', e.target.value)} />
                </EditRow>
                <EditRow label="Time">
                  <input type="time" className={inputClass} value={form.time} onChange={(e) => set('time', e.target.value)} />
                </EditRow>
              </div>
              <EditRow label="Service Type">
                <select className={inputClass} value={form.service_type} onChange={(e) => set('service_type', e.target.value)}>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </EditRow>
              {needsHours && (
                <EditRow label="Hours">
                  <input type="number" min="0" step="0.5" className={inputClass} value={form.hours} onChange={(e) => set('hours', e.target.value)} />
                </EditRow>
              )}
              {needsFlightNumber && (
                <EditRow label="Flight Number">
                  <input className={inputClass} value={form.flight_number} onChange={(e) => set('flight_number', e.target.value)} />
                </EditRow>
              )}
            </Section>

            <Section title="Vehicle & Party">
              <EditRow label="Vehicle (reference only)">
                <select className={inputClass} value={form.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)}>
                  <option value="">{vehiclesLoaded ? 'Select a vehicle' : 'Loading vehicles…'}</option>
                  {vehicleList.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </EditRow>
              <div className="grid grid-cols-3 gap-3">
                <EditRow label="Passengers">
                  <input
                    type="number"
                    min="1"
                    max={MAX_PASSENGERS}
                    className={inputClass}
                    value={form.passengers}
                    onChange={(e) => set('passengers', e.target.value)}
                  />
                </EditRow>
                <EditRow label="Luggage">
                  <input
                    type="number"
                    min="0"
                    max={MAX_LUGGAGE}
                    className={inputClass}
                    value={form.suitcases}
                    onChange={(e) => set('suitcases', e.target.value)}
                  />
                </EditRow>
                <EditRow label="Child Seats">
                  <input
                    type="number"
                    min="0"
                    max={CHILD_SEAT_MAX}
                    className={inputClass}
                    value={form.child_seats}
                    onChange={(e) => set('child_seats', e.target.value)}
                  />
                </EditRow>
              </div>
            </Section>

            <Section title="Notes">
              <textarea
                rows={3}
                maxLength={250}
                className={inputClass}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Section>

            <Section title="Total Price">
              <div className="flex items-center border border-black/15 px-3 py-2">
                <span className="mr-1 text-black/40">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full text-sm text-brand-gold outline-none"
                  value={form.total_price}
                  onChange={(e) => set('total_price', e.target.value)}
                />
              </div>
            </Section>

            {saveError && <p className="text-sm text-red-500">{saveError}</p>}

            <div className="flex items-center gap-3 border-t border-black/10 pt-4">
              <button
                type="button"
                disabled={!canSave || saving}
                onClick={handleSave}
                className="border border-brand-gold bg-brand-gold px-4 py-2 text-xs text-brand-black disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="text-xs text-black/50 hover:underline disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
