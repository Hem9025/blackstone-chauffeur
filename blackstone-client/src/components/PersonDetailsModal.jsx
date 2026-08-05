import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import Modal from './Modal'
import StatusBadge from './StatusBadge'
import { bookings as bookingsApi, admin as adminApi } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function monthLabel(month) {
  const [y, m] = month.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })
}

// Full detail popup for a single driver or provider — contact info, the
// same aggregate stats shown in the table, AND their actual booking list
// (what they've actually done, not just a count). Providers additionally
// get a flexible monthly payment tracker, since they settle up with admin
// periodically rather than per-booking — admin can mark any month
// paid/unpaid whenever a payment actually comes in, no fixed schedule.
export default function PersonDetailsModal({ person, role, onClose }) {
  const [bookingList, setBookingList] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  const [paymentHistory, setPaymentHistory] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [pickedMonth, setPickedMonth] = useState(currentMonth())
  const [togglingMonth, setTogglingMonth] = useState(false)

  useEffect(() => {
    if (!person) return
    setLoadingBookings(true)
    const query = role === 'driver' ? `?driver_id=${person.id}&sort=date_desc` : `?provider_id=${person.id}&sort=date_desc`
    bookingsApi
      .all(query)
      .then(setBookingList)
      .catch(() => setBookingList([]))
      .finally(() => setLoadingBookings(false))

    if (role === 'provider') {
      setPickedMonth(currentMonth())
      loadPayments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, role])

  function loadPayments() {
    if (!person) return
    setLoadingPayments(true)
    adminApi
      .providerPayments(person.id)
      .then(setPaymentHistory)
      .catch(() => setPaymentHistory([]))
      .finally(() => setLoadingPayments(false))
  }

  async function toggleMonth(month, nextStatus) {
    setTogglingMonth(true)
    try {
      await adminApi.setProviderPayment({ provider_id: person.id, month, status: nextStatus })
      loadPayments()
    } catch {
      // Silently keep whatever the last known state was — the toggle button
      // itself doesn't need its own error banner for a background save.
    } finally {
      setTogglingMonth(false)
    }
  }

  if (!person) return null

  const pickedRecord = paymentHistory.find((p) => p.month === pickedMonth)
  const pickedStatus = pickedRecord?.status || 'unpaid'

  return (
    <Modal open={Boolean(person)} onClose={onClose} title={person.name}>
      <div className="flex flex-col gap-5">
        <div className="text-sm text-black/70">
          <p>{person.email}</p>
          {person.phone && <p>{person.phone}</p>}
        </div>

        {role === 'provider' && (
          <div className="border-t border-black/10 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">Monthly Payment</p>
            <p className="mb-3 text-xs text-black/50">
              Mark whichever month a payment actually lands in — there's no fixed schedule this has to follow.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="month"
                value={pickedMonth}
                onChange={(e) => setPickedMonth(e.target.value)}
                className="border border-black/15 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={togglingMonth}
                onClick={() => toggleMonth(pickedMonth, pickedStatus === 'paid' ? 'unpaid' : 'paid')}
                className={`flex items-center gap-1.5 border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
                  pickedStatus === 'paid'
                    ? 'border-green-600/30 bg-green-50 text-green-700'
                    : 'border-red-300 bg-red-50 text-red-600'
                }`}
              >
                {pickedStatus === 'paid' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {pickedStatus === 'paid' ? 'Paid' : 'Unpaid'} — click to toggle
              </button>
            </div>

            {!loadingPayments && paymentHistory.length > 0 && (
              <div className="mt-3 flex flex-col gap-1">
                {paymentHistory.map((p) => (
                  <div key={p.month} className="flex items-center justify-between text-xs text-black/60">
                    <span>{monthLabel(p.month)}</span>
                    <span className={p.status === 'paid' ? 'text-green-700' : 'text-red-500'}>
                      {p.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-black/10 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">
            {role === 'driver' ? 'Rides Fulfilled' : 'Bookings Placed'}
          </p>
          {loadingBookings && <p className="text-sm text-black/40">Loading…</p>}
          {!loadingBookings && !bookingList.length && (
            <p className="text-sm text-black/40">No bookings yet.</p>
          )}
          <div className="flex flex-col gap-3">
            {bookingList.map((b) => (
              <div key={b.id} className="border border-black/10 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-black">{formatDate(b.date)} — {b.pickup} → {b.dropoff}</p>
                  <p className="shrink-0 text-black">{formatCurrency(b.total_price)}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={b.booking_status} />
                  <span className="text-xs capitalize text-black/50">Payment: {b.payment_status}</span>
                  {b.passenger_name && <span className="text-xs text-black/50">· {b.passenger_name}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
