import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, FileDown, FileSpreadsheet } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import StatusBadge from '../components/StatusBadge'
import { bookings as bookingsApi, admin as adminApi } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function monthLabel(month) {
  const [y, m] = month.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })
}

// Turns a "2026-08" month value into its first/last calendar day, so picking
// a month from the dropdown is just a shortcut for a from/to range — the
// two custom date inputs stay the source of truth either way.
function monthBounds(month) {
  const [y, m] = month.split('-').map(Number)
  const from = `${month}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const to = `${month}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

// One driver's or one provider's own page — contact info, their aggregate
// stats, their actual booking list, a provider-only monthly payment
// tracker, and a PDF/CSV export of just their bookings. Replaces the old
// modal (PersonDetailsModal) so this can be linked to, bookmarked, and
// downloaded from directly rather than only reachable by clicking a row.
export default function AdminPersonDetail({ role }) {
  const { id } = useParams()
  const label = role === 'driver' ? 'Driver' : 'Provider'

  const [person, setPerson] = useState(null)
  const [loadingPerson, setLoadingPerson] = useState(true)
  const [error, setError] = useState('')

  const [bookingList, setBookingList] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  // Booking-list filter — a month shortcut plus two custom date inputs, so
  // "for months or any other way" both work off the same from/to state.
  const [listFilterMonth, setListFilterMonth] = useState('')
  const [listFrom, setListFrom] = useState('')
  const [listTo, setListTo] = useState('')

  const [paymentHistory, setPaymentHistory] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [pickedMonth, setPickedMonth] = useState(currentMonth())
  const [togglingMonth, setTogglingMonth] = useState(false)

  useEffect(() => {
    setLoadingPerson(true)
    setError('')
    adminApi
      .stats(role, id)
      .then((data) => setPerson((data.users || [])[0] || null))
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoadingPerson(false))

    if (role === 'provider') {
      setPickedMonth(currentMonth())
      loadPayments()
    }
    setListFilterMonth('')
    setListFrom('')
    setListTo('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, id])

  useEffect(() => {
    setLoadingBookings(true)
    const params = new URLSearchParams()
    params.set(role === 'driver' ? 'driver_id' : 'provider_id', id)
    params.set('sort', 'date_desc')
    if (listFrom) params.set('date_from', listFrom)
    if (listTo) params.set('date_to', listTo)
    bookingsApi
      .all(`?${params.toString()}`)
      .then(setBookingList)
      .catch(() => setBookingList([]))
      .finally(() => setLoadingBookings(false))
  }, [role, id, listFrom, listTo])

  function applyMonthFilter(month) {
    setListFilterMonth(month)
    if (!month) return
    const { from, to } = monthBounds(month)
    setListFrom(from)
    setListTo(to)
  }

  function clearListFilter() {
    setListFilterMonth('')
    setListFrom('')
    setListTo('')
  }

  const reportQuery = (() => {
    const params = new URLSearchParams()
    if (listFrom) params.set('date_from', listFrom)
    if (listTo) params.set('date_to', listTo)
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  })()

  function loadPayments() {
    setLoadingPayments(true)
    adminApi
      .providerPayments(id)
      .then(setPaymentHistory)
      .catch(() => setPaymentHistory([]))
      .finally(() => setLoadingPayments(false))
  }

  async function toggleMonth(month, nextStatus) {
    setTogglingMonth(true)
    try {
      await adminApi.setProviderPayment({ provider_id: id, month, status: nextStatus })
      loadPayments()
    } catch {
      // Silently keep whatever the last known state was — the toggle button
      // itself doesn't need its own error banner for a background save.
    } finally {
      setTogglingMonth(false)
    }
  }

  const pickedRecord = paymentHistory.find((p) => p.month === pickedMonth)
  const pickedStatus = pickedRecord?.status || 'unpaid'

  return (
    <div>
      <PageMeta title={person ? person.name : label} description={`${label} detail and booking history — BlackStone Chauffeur admin.`} />

      <Link to={`/admin/${role}s`} className="flex items-center gap-1.5 text-sm text-brand-black/50 hover:text-brand-black">
        <ArrowLeft size={15} /> Back to {label}s
      </Link>

      {loadingPerson && <p className="mt-6 text-brand-black/50">Loading…</p>}
      {error && <p className="mt-6 text-red-500">{error}</p>}
      {!loadingPerson && !error && !person && <p className="mt-6 text-brand-black/50">{label} not found.</p>}

      {person && (
        <>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl text-brand-black">{person.name}</h1>
              <p className="mt-1 text-sm text-brand-black/60">{person.email}{person.phone ? ` · ${person.phone}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => bookingsApi.downloadPersonReport(role, id, person.name, reportQuery)}
                className="flex items-center gap-1.5 border border-brand-black/15 px-3 py-2 text-xs font-medium text-brand-black/70 hover:border-brand-gold hover:text-brand-black"
              >
                <FileDown size={14} /> Download PDF
              </button>
              <button
                onClick={() => bookingsApi.downloadPersonCsv(role, id, person.name, reportQuery)}
                className="flex items-center gap-1.5 border border-brand-black/15 px-3 py-2 text-xs font-medium text-brand-black/70 hover:border-brand-gold hover:text-brand-black"
              >
                <FileSpreadsheet size={14} /> Download CSV
              </button>
            </div>
          </div>

          <div className={`mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 ${role === 'driver' ? 'lg:grid-cols-6' : 'lg:grid-cols-4'}`}>
            <StatCard label="Total Bookings" value={person.total_bookings} />
            <StatCard label="Completed" value={person.completed_count} />
            <StatCard label="Upcoming" value={person.upcoming_count} />
            <StatCard label="Cancelled" value={person.cancelled_count} />
            <StatCard label={role === 'driver' ? 'Fare Value' : 'Revenue'} value={formatCurrency(person.completed_revenue)} />
            {role === 'driver' && <StatCard label="Payout" value={formatCurrency(person.driver_payout)} />}
            {role === 'driver' && <StatCard label="Admin Margin" value={formatCurrency(person.admin_margin)} />}
          </div>

          {role === 'provider' && (
            <div className="mt-8 border border-brand-black/10 bg-white p-5">
              <p className="mb-1 font-heading text-base text-brand-black">Monthly Payment</p>
              <p className="mb-3 text-xs text-brand-black/50">
                Mark whichever month a payment actually lands in — there's no fixed schedule this has to follow.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="month"
                  value={pickedMonth}
                  onChange={(e) => setPickedMonth(e.target.value)}
                  className="border border-brand-black/15 px-3 py-2 text-sm"
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
                    <div key={p.month} className="flex items-center justify-between text-xs text-brand-black/60">
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

          <div className="mt-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="font-heading text-base text-brand-black">
                {role === 'driver' ? 'Rides Fulfilled' : 'Bookings Placed'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="month"
                  value={listFilterMonth}
                  onChange={(e) => applyMonthFilter(e.target.value)}
                  className="border border-brand-black/15 px-2.5 py-1.5 text-xs"
                />
                <span className="text-xs text-brand-black/30">or</span>
                <input
                  type="date"
                  value={listFrom}
                  onChange={(e) => { setListFilterMonth(''); setListFrom(e.target.value) }}
                  className="border border-brand-black/15 px-2.5 py-1.5 text-xs"
                />
                <span className="text-xs text-brand-black/30">to</span>
                <input
                  type="date"
                  value={listTo}
                  onChange={(e) => { setListFilterMonth(''); setListTo(e.target.value) }}
                  className="border border-brand-black/15 px-2.5 py-1.5 text-xs"
                />
                {(listFilterMonth || listFrom || listTo) && (
                  <button
                    type="button"
                    onClick={clearListFilter}
                    className="text-xs text-brand-black/40 hover:text-brand-black"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {(listFrom || listTo) && (
              <p className="mb-3 text-xs text-brand-black/40">
                Showing {listFrom ? formatDate(listFrom) : 'the start'} to {listTo ? formatDate(listTo) : 'now'} — the PDF/CSV downloads above match this range.
              </p>
            )}
            {loadingBookings && <p className="text-sm text-brand-black/40">Loading…</p>}
            {!loadingBookings && !bookingList.length && (
              <p className="text-sm text-brand-black/40">No bookings yet.</p>
            )}
            <div className="flex flex-col gap-3">
              {bookingList.map((b) => (
                <div key={b.id} className="border border-brand-black/10 bg-white p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-brand-black">{formatDate(b.date)} — {b.pickup} → {b.dropoff || 'Destination TBC'}</p>
                    <p className="shrink-0 text-brand-black">{formatCurrency(b.total_price)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={b.booking_status} />
                    <span className="text-xs capitalize text-brand-black/50">Payment: {b.payment_status}</span>
                    {b.passenger_name && <span className="text-xs text-brand-black/50">· {b.passenger_name}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="border border-brand-black/10 bg-white p-4">
      <p className="text-xs text-brand-black/50">{label}</p>
      <p className="mt-1 font-heading text-xl text-brand-black">{value}</p>
    </div>
  )
}
