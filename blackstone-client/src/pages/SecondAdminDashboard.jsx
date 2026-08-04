import { useEffect, useState } from 'react'
import { Download, FileText, List, CalendarDays, CalendarPlus, PlusCircle } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import BookingCalendar from '../components/BookingCalendar'
import StatusBadge from '../components/StatusBadge'
import AdminNewBookingTab from '../components/AdminNewBookingTab'
import { bookings as bookingsApi } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'
import { bookingsToCSV } from '../utils/exportBookings'
import { googleCalendarUrl } from '../utils/googleCalendar'

const STATUS_OPTIONS = ['pending', 'assigned', 'en_route', 'arrived', 'completed', 'cancelled']
const PAYMENT_OPTIONS = ['pending', 'paid', 'failed', 'refunded']

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function SecondAdminDashboard() {
  const [list, setList] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [driverInputs, setDriverInputs] = useState({})
  const [assigningId, setAssigningId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [view, setView] = useState('list')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState('date_desc')

  function buildQuery() {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (paymentStatus) params.set('payment_status', paymentStatus)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (sort) params.set('sort', sort)
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  function load() {
    setLoading(true)
    bookingsApi
      .all(buildQuery())
      .then(setList)
      .catch((err) => setError(err.message || 'Failed to load bookings'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [status, paymentStatus, dateFrom, dateTo, sort])

  useEffect(() => {
    bookingsApi.drivers().then(setDrivers).catch(() => setDrivers([]))
  }, [])

  async function assignDriver(id) {
    const driverId = driverInputs[id]
    if (!driverId) return
    setAssigningId(id)
    try {
      await bookingsApi.assignDriver(id, driverId)
      load()
    } catch (err) {
      setError(err.message || 'Failed to assign driver')
    } finally {
      setAssigningId(null)
    }
  }

  async function cancelBooking(id) {
    if (!window.confirm('Cancel this booking? This can\'t be undone.')) return
    setCancellingId(id)
    try {
      await bookingsApi.cancel(id)
      load()
    } catch (err) {
      setError(err.message || 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  async function deleteBooking(id) {
    if (!window.confirm('Permanently delete this booking? This removes it entirely and can\'t be undone.')) return
    setDeletingId(id)
    try {
      await bookingsApi.remove(id)
      load()
    } catch (err) {
      setError(err.message || 'Failed to delete booking')
    } finally {
      setDeletingId(null)
    }
  }

  function DeleteControl({ b }) {
    return (
      <button
        disabled={deletingId === b.id}
        onClick={() => deleteBooking(b.id)}
        className="text-xs text-red-600 hover:underline disabled:opacity-40"
      >
        {deletingId === b.id ? 'Deleting…' : 'Delete'}
      </button>
    )
  }

  function CancelControl({ b }) {
    if (['completed', 'cancelled'].includes(b.booking_status)) return <span className="text-xs text-brand-black/30">—</span>
    return (
      <button
        disabled={cancellingId === b.id}
        onClick={() => cancelBooking(b.id)}
        className="text-xs text-red-500 hover:underline disabled:opacity-40"
      >
        {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
      </button>
    )
  }

  function AssignDriverControl({ b }) {
    // Falls back to whatever driver is already assigned, so the dropdown
    // reflects current state instead of always starting blank.
    const selected = driverInputs[b.id] ?? (b.driver_id ? String(b.driver_id) : '')
    return (
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setDriverInputs((prev) => ({ ...prev, [b.id]: e.target.value }))}
          className="border border-brand-black/15 px-2 py-1 text-xs"
        >
          <option value="">Select driver…</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button
          disabled={assigningId === b.id || !selected}
          onClick={() => assignDriver(b.id)}
          className="border border-brand-gold px-3 py-1 text-xs text-brand-gold hover:bg-brand-gold hover:text-brand-black disabled:opacity-40"
        >
          Assign
        </button>
      </div>
    )
  }

  const dayBookings = list.filter((b) => b.date && sameDay(new Date(b.date), selectedDate))

  return (
    <div>
      <PageMeta title="Admin Dashboard" description="All bookings — BlackStone Chauffeur admin." />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl text-brand-black">All Bookings</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex border border-brand-black/15">
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1 px-3 py-2 text-xs ${view === 'list' ? 'bg-brand-black text-white' : 'text-brand-black/60'}`}
              >
                <List size={14} /> List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-1 px-3 py-2 text-xs ${view === 'calendar' ? 'bg-brand-black text-white' : 'text-brand-black/60'}`}
              >
                <CalendarDays size={14} /> Calendar
              </button>
              <button
                onClick={() => setView('new')}
                className={`flex items-center gap-1 px-3 py-2 text-xs ${view === 'new' ? 'bg-brand-black text-white' : 'text-brand-black/60'}`}
              >
                <PlusCircle size={14} /> New Booking
              </button>
            </div>
            {view !== 'new' && (
              <>
                <button
                  onClick={() => bookingsToCSV(list, 'all-bookings.csv')}
                  disabled={!list.length}
                  className="flex items-center gap-1 border border-brand-black/20 px-3 py-2 text-xs text-brand-black hover:bg-brand-black hover:text-white disabled:opacity-40"
                >
                  <Download size={13} /> CSV
                </button>
                <button
                  onClick={() => bookingsApi.downloadAllReport(buildQuery())}
                  disabled={!list.length}
                  className="flex items-center gap-1 border border-brand-black/20 px-3 py-2 text-xs text-brand-black hover:bg-brand-black hover:text-white disabled:opacity-40"
                >
                  <FileText size={13} /> PDF
                </button>
              </>
            )}
          </div>
        </div>

        {view === 'new' && <AdminNewBookingTab onCreated={load} />}

        {view !== 'new' && (
        <>
        <div className="mt-6 flex flex-wrap gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-brand-black/15 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="border border-brand-black/15 px-3 py-2 text-sm">
            <option value="">All payment statuses</option>
            {PAYMENT_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-brand-black/15 px-3 py-2 text-sm" />
          <span className="self-center text-sm text-brand-black/40">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-brand-black/15 px-3 py-2 text-sm" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-brand-black/15 px-3 py-2 text-sm">
            <option value="date_desc">Newest trip first</option>
            <option value="date_asc">Oldest trip first</option>
            <option value="created_desc">Recently booked</option>
            <option value="price_desc">Highest price</option>
            <option value="price_asc">Lowest price</option>
          </select>
        </div>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && <p className="mt-8 text-red-500">{error}</p>}

        {!loading && !error && view === 'list' && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-black/10 text-left text-brand-black/50">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Route</th>
                  <th className="py-2 pr-4">Vehicle</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Driver</th>
                  <th className="py-2 pr-4">Assign Driver</th>
                  <th className="py-2 pr-4">Invoice</th>
                  <th className="py-2 pr-4">Calendar</th>
                  <th className="py-2 pr-4">Cancel</th>
                  <th className="py-2 pr-4">Delete</th>
                </tr>
              </thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b.id} className="border-b border-brand-black/5">
                    <td className="py-2 pr-4">{formatDate(b.date)}</td>
                    <td className="py-2 pr-4">{b.passenger_name || b.customer_name || '—'}</td>
                    <td className="py-2 pr-4">{b.passenger_email || b.customer_email || '—'}</td>
                    <td className="py-2 pr-4">{b.pickup} → {b.dropoff}</td>
                    <td className="py-2 pr-4">{b.vehicle_name || '—'}</td>
                    <td className="py-2 pr-4"><StatusBadge status={b.booking_status} /></td>
                    <td className="py-2 pr-4 capitalize">{b.payment_status}</td>
                    <td className="py-2 pr-4">{formatCurrency(b.total_price)}</td>
                    <td className="py-2 pr-4">{b.driver_id || '—'}</td>
                    <td className="py-2 pr-4">
                      <AssignDriverControl b={b} />
                    </td>
                    <td className="py-2 pr-4">
                      <button onClick={() => bookingsApi.downloadInvoice(b.id)} className="text-xs text-brand-gold hover:underline">
                        Download
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      <a href={googleCalendarUrl(b)} target="_blank" rel="noreferrer" className="text-brand-black/40 hover:text-brand-gold" aria-label="Add to Google Calendar">
                        <CalendarPlus size={15} />
                      </a>
                    </td>
                    <td className="py-2 pr-4">
                      <CancelControl b={b} />
                    </td>
                    <td className="py-2 pr-4">
                      <DeleteControl b={b} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <p className="py-8 text-brand-black/50">No bookings found.</p>}
          </div>
        )}

        {!loading && !error && view === 'calendar' && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <BookingCalendar bookings={list} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

            <div className="border border-brand-black/10 bg-white p-5">
              <p className="font-heading text-base text-brand-black">
                {selectedDate.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="mt-4 flex flex-col gap-4">
                {dayBookings.length === 0 && <p className="text-sm text-brand-black/40">No bookings on this day.</p>}
                {dayBookings.map((b) => (
                  <div key={b.id} className="border-b border-brand-black/5 pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-brand-black">
                      {String(b.time).slice(0, 5)} — {b.pickup} → {b.dropoff}
                    </p>
                    <p className="mt-1 text-xs text-brand-black/50">
                      {b.passenger_name || b.customer_name || '—'} · {b.passenger_email || b.customer_email || '—'} · {b.vehicle_name || '—'} · {formatCurrency(b.total_price)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={b.booking_status} />
                      <span className="text-xs capitalize text-brand-black/50">Payment: {b.payment_status}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <AssignDriverControl b={b} />
                      <button onClick={() => bookingsApi.downloadInvoice(b.id)} className="text-xs text-brand-gold hover:underline">
                        Invoice
                      </button>
                      <a
                        href={googleCalendarUrl(b)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-black/50 hover:text-brand-gold"
                      >
                        <CalendarPlus size={13} /> Add to Google Calendar
                      </a>
                      <CancelControl b={b} />
                      <DeleteControl b={b} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </section>
    </div>
  )
}
