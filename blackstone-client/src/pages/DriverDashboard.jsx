import { useEffect, useState } from 'react'
import { List, CalendarDays, CalendarPlus } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import BookingCalendar from '../components/BookingCalendar'
import StatusBadge from '../components/StatusBadge'
import { bookings as bookingsApi } from '../utils/api'
import { formatDate, formatCurrency } from '../utils/helpers'
import { googleCalendarUrl } from '../utils/googleCalendar'

const STATUS_FLOW = ['en_route', 'arrived', 'completed']

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function DriverDashboard() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [view, setView] = useState('list')
  const [selectedDate, setSelectedDate] = useState(new Date())

  function load() {
    setLoading(true)
    bookingsApi
      .driver()
      .then(setList)
      .catch((err) => setError(err.message || 'Failed to load rides'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function updateStatus(id, status) {
    setUpdatingId(id)
    try {
      await bookingsApi.updateStatus(id, status)
      load()
    } catch (err) {
      setError(err.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  function RideActions({ ride }) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FLOW.map((status) => (
          <button
            key={status}
            disabled={updatingId === ride.id || ride.booking_status === status}
            onClick={() => updateStatus(ride.id, status)}
            className="border border-brand-gold px-3 py-1.5 text-xs uppercase tracking-wide text-brand-gold hover:bg-brand-gold hover:text-brand-black disabled:opacity-40"
          >
            {status.replace('_', ' ')}
          </button>
        ))}
        <a
          href={googleCalendarUrl(ride)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-brand-black/50 hover:text-brand-gold"
        >
          <CalendarPlus size={13} /> Add to Google Calendar
        </a>
      </div>
    )
  }

  const dayRides = list.filter((r) => r.date && sameDay(new Date(r.date), selectedDate))

  return (
    <div>
      <PageMeta title="Driver Dashboard" description="Your assigned BlackStone Chauffeur rides." />

      <section className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl text-brand-black">Assigned Rides</h1>
          <div className="flex border border-brand-black/15">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs ${view === 'list' ? 'bg-brand-black text-white' : 'text-brand-black/60'}`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs ${view === 'calendar' ? 'bg-brand-black text-white' : 'text-brand-black/60'}`}
            >
              <CalendarDays size={14} /> Calendar
            </button>
          </div>
        </div>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && <p className="mt-8 text-red-500">{error}</p>}
        {!loading && !error && list.length === 0 && (
          <p className="mt-8 text-brand-black/50">No rides assigned yet.</p>
        )}

        {!loading && !error && list.length > 0 && view === 'list' && (
          <div className="mt-8 flex flex-col gap-4">
            {list.map((ride) => (
              <div key={ride.id} className="border border-brand-black/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-brand-black">
                        {ride.pickup} → {ride.dropoff}
                      </p>
                      <StatusBadge status={ride.booking_status} />
                    </div>
                    <p className="text-sm text-brand-black/50">
                      {formatDate(ride.date)} at {String(ride.time).slice(0, 5)}
                    </p>
                    {/* Never the customer's total_price — only ever what
                        admin has set aside as this driver's own pay for
                        this specific ride, and only when they've set one. */}
                    {ride.driver_price != null && (
                      <p className="mt-1 text-sm font-medium text-brand-gold">
                        Your pay: {formatCurrency(ride.driver_price)}
                      </p>
                    )}
                  </div>
                  <RideActions ride={ride} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && list.length > 0 && view === 'calendar' && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <BookingCalendar bookings={list} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

            <div className="border border-brand-black/10 bg-white p-5">
              <p className="font-heading text-base text-brand-black">
                {selectedDate.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="mt-4 flex flex-col gap-4">
                {dayRides.length === 0 && <p className="text-sm text-brand-black/40">No rides on this day.</p>}
                {dayRides.map((ride) => (
                  <div key={ride.id} className="border-b border-brand-black/5 pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-brand-black">
                      {String(ride.time).slice(0, 5)} — {ride.pickup} → {ride.dropoff}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={ride.booking_status} />
                      {ride.driver_price != null && (
                        <span className="text-xs font-medium text-brand-gold">
                          Your pay: {formatCurrency(ride.driver_price)}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <RideActions ride={ride} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
