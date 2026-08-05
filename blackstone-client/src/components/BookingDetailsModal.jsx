import Modal from './Modal'
import StatusBadge from './StatusBadge'
import { formatCurrency, formatDate } from '../utils/helpers'

const TRIP_TYPE_LABELS = { one_way: 'One Way', return: 'Return', hourly: 'Hourly' }

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

// Full-detail popup for a single booking — every relevant column from the
// bookings table (plus joined vehicle/customer names), so the underlying
// table row can stay short and this is where "show me everything" lives.
// `actions` is an optional slot for whatever action controls the caller
// wants (assign driver, cancel, delete, invoice, calendar) — kept as
// caller-supplied JSX so this component doesn't duplicate that logic.
export default function BookingDetailsModal({ booking, drivers = [], onClose, actions }) {
  if (!booking) return null

  const passengerName = booking.passenger_name || booking.customer_name || '—'
  const passengerEmail = booking.passenger_email || booking.customer_email || '—'
  const driver = drivers.find((d) => String(d.id) === String(booking.driver_id))
  const stopAddresses = Array.isArray(booking.stop_addresses) ? booking.stop_addresses : []
  const extras = Array.isArray(booking.extras) ? booking.extras : []

  return (
    <Modal open={Boolean(booking)} onClose={onClose} title={`Booking #${booking.id}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.booking_status} />
          <span className="rounded-full border border-black/15 px-2.5 py-1 text-xs capitalize text-black/60">
            Payment: {booking.payment_status}
          </span>
        </div>

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
      </div>
    </Modal>
  )
}
