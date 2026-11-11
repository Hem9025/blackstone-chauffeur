import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, Phone, User, ChevronRight, MapPin } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { bookings as bookingsApi } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'

const FINISHED = ['completed', 'archived', 'cancelled']

// Phone-app home for customers (app only — the website keeps CustomerDashboard).
// Big quick actions on top, the next ride front and centre, the rest below.
export default function AppCustomerHome() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [showPast, setShowPast] = useState(false)

  function load() {
    bookingsApi
      .my()
      .then(setList)
      .catch((err) => setError(err.message || 'Failed to load rides'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleCancel(id) {
    if (!window.confirm("Cancel this ride? This can't be undone.")) return
    setCancellingId(id)
    try {
      await bookingsApi.cancel(id)
      load()
    } catch (err) {
      setError(err.message || 'Failed to cancel ride')
    } finally {
      setCancellingId(null)
    }
  }

  const upcoming = list
    .filter((b) => !FINISHED.includes(b.booking_status))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  const past = list.filter((b) => FINISHED.includes(b.booking_status))
  const [next, ...later] = upcoming
  const firstName = (user?.name || '').split(' ')[0]

  return (
    <div className="mx-auto max-w-md px-4 pb-6 pt-5">
      <h2 className="font-heading text-2xl text-brand-black">
        {firstName ? `Hello, ${firstName}` : 'Hello'}
      </h2>
      <p className="text-sm text-black/50">Where can we take you?</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <QuickAction to="/booking" icon={CalendarPlus} label="Book a ride" primary />
        <QuickAction href="tel:+64204525000" icon={Phone} label="Call us" />
        <QuickAction to="/profile" icon={User} label="Account" />
      </div>

      {loading && <p className="mt-8 text-sm text-black/50">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

      {!loading && (
        <>
          <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-black/40">Next ride</h3>
          {next ? (
            <RideCard ride={next} big onCancel={handleCancel} cancelling={cancellingId === next.id} />
          ) : (
            <div className="mt-3 rounded-2xl bg-white p-5 text-center shadow-sm">
              <p className="text-sm text-black/50">No upcoming rides.</p>
              <Link to="/booking" className="mt-3 inline-block text-sm font-semibold text-brand-gold">
                Book your first ride
              </Link>
            </div>
          )}

          {later.length > 0 && (
            <>
              <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-black/40">Also coming up</h3>
              <div className="mt-3 flex flex-col gap-3">
                {later.map((r) => (
                  <RideCard key={r.id} ride={r} onCancel={handleCancel} cancelling={cancellingId === r.id} />
                ))}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="mt-8 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-black/40"
              >
                Past rides ({past.length})
                <ChevronRight size={16} className={showPast ? 'rotate-90' : ''} />
              </button>
              {showPast && (
                <div className="mt-3 flex flex-col gap-3">
                  {past.map((r) => (
                    <RideCard key={r.id} ride={r} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function QuickAction({ to, href, icon: Icon, label, primary }) {
  const cls = `flex flex-col items-center justify-center gap-2 rounded-2xl py-4 text-xs font-semibold active:opacity-80 ${
    primary ? 'bg-brand-gold text-brand-black' : 'bg-white text-brand-black shadow-sm'
  }`
  const inner = (
    <>
      <Icon size={24} strokeWidth={1.8} />
      {label}
    </>
  )
  return href ? (
    <a href={href} className={cls}>{inner}</a>
  ) : (
    <Link to={to} className={cls}>{inner}</Link>
  )
}

function RideCard({ ride, big, onCancel, cancelling }) {
  const canCancel = onCancel && !FINISHED.includes(ride.booking_status)
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm ${big ? 'mt-3' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`font-semibold text-brand-black ${big ? 'text-lg' : 'text-sm'}`}>
            {formatDate(ride.date)}
            {ride.time ? ` · ${String(ride.time).slice(0, 5)}` : ''}
          </p>
          <p className="mt-0.5 text-xs text-black/45">{formatCurrency(ride.total_price)}</p>
        </div>
        <StatusBadge status={ride.booking_status} />
      </div>
      <div className="mt-3 flex items-start gap-2 text-sm text-black/70">
        <MapPin size={15} className="mt-0.5 shrink-0 text-brand-gold" />
        <p>
          {ride.pickup}
          {ride.dropoff ? <span className="text-black/40"> → </span> : null}
          {ride.dropoff}
        </p>
      </div>
      {canCancel && (
        <button
          type="button"
          disabled={cancelling}
          onClick={() => onCancel(ride.id)}
          className="mt-3 text-xs font-medium text-red-500 disabled:opacity-40"
        >
          {cancelling ? 'Cancelling…' : 'Cancel ride'}
        </button>
      )}
    </div>
  )
}
