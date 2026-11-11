import { useEffect, useState } from 'react'
import { Phone, Navigation, ChevronDown } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { bookings as bookingsApi } from '../utils/api'
import { formatDate, formatCurrency } from '../utils/helpers'
import DriverDownloads from '../components/DriverDownloads'
import { RideDetails } from './DriverDashboard'

const FLOW = ['en_route', 'arrived', 'completed']
const NEXT_LABEL = { en_route: "I'm on my way", arrived: "I've arrived", completed: 'Complete ride' }
const FINISHED = ['completed', 'archived', 'cancelled']

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function nextStatus(current) {
  if (FINISHED.includes(current)) return null
  const i = FLOW.indexOf(current)
  return FLOW[i + 1] ?? (i === -1 ? FLOW[0] : null)
}

function mapsUrl(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

// Phone-app job list for drivers (app only — the website keeps DriverDashboard).
// Today / Upcoming / Past, one card per ride, one big button for the next step.
export default function AppDriverJobs() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [tab, setTab] = useState('today')
  const [openId, setOpenId] = useState(null)

  function load() {
    bookingsApi
      .driver()
      .then(setList)
      .catch((err) => setError(err.message || 'Failed to load jobs'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function advance(ride, status) {
    setUpdatingId(ride.id)
    setError('')
    try {
      await bookingsApi.updateStatus(ride.id, status)
      load()
    } catch (err) {
      setError(err.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const today = new Date()
  const byDate = (a, b) => new Date(a.date) - new Date(b.date) || String(a.time).localeCompare(String(b.time))
  const open = list.filter((r) => !FINISHED.includes(r.booking_status))
  const groups = {
    today: open.filter((r) => !r.date || new Date(r.date) <= today || sameDay(new Date(r.date), today)).sort(byDate),
    upcoming: open.filter((r) => r.date && new Date(r.date) > today && !sameDay(new Date(r.date), today)).sort(byDate),
    past: list.filter((r) => FINISHED.includes(r.booking_status)).sort((a, b) => byDate(b, a)),
  }
  const rides = groups[tab]

  return (
    <div className="mx-auto max-w-md px-4 pb-6 pt-4">
      <div className="flex rounded-full bg-black/5 p-1">
        {[
          ['today', 'Today'],
          ['upcoming', 'Upcoming'],
          ['past', 'Past'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              tab === key ? 'bg-white text-brand-black shadow-sm' : 'text-black/50'
            }`}
          >
            {label}
            {groups[key].length > 0 && key !== 'past' ? ` (${groups[key].length})` : ''}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-black/45">Download my rides</span>
        <DriverDownloads disabled={list.length === 0} />
      </div>

      {loading && <p className="mt-8 text-sm text-black/50">Loading…</p>}
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {!loading && rides.length === 0 && (
        <p className="mt-10 text-center text-sm text-black/45">
          {tab === 'today' ? 'No jobs for today.' : tab === 'upcoming' ? 'No upcoming jobs.' : 'No past jobs yet.'}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {rides.map((ride) => {
          const phone = ride.passenger_phone || ride.customer_phone
          const phoneHref = phone ? String(phone).replace(/[^0-9+]/g, '') : ''
          const next = nextStatus(ride.booking_status)
          // Heading to the pickup until the passenger is on board, then the drop-off.
          const goingToDropoff = ride.booking_status === 'arrived' && ride.dropoff
          const destination = goingToDropoff ? ride.dropoff : ride.pickup
          const isOpen = openId === ride.id
          return (
            <div key={ride.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-brand-black">
                    {ride.time ? String(ride.time).slice(0, 5) : 'TBC'}
                  </p>
                  <p className="text-xs text-black/45">{formatDate(ride.date)}</p>
                </div>
                <StatusBadge status={ride.booking_status} />
              </div>

              <p className="mt-3 text-sm text-brand-black">{ride.pickup}</p>
              <p className="text-sm text-black/45">→ {ride.dropoff || 'Destination TBC'}</p>
              {ride.driver_price != null && (
                <p className="mt-2 text-sm font-medium text-brand-gold">Your pay: {formatCurrency(ride.driver_price)}</p>
              )}

              {!FINISHED.includes(ride.booking_status) && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {phoneHref ? (
                    <a
                      href={`tel:${phoneHref}`}
                      className="flex items-center justify-center gap-2 rounded-xl border border-black/10 py-3 text-sm font-medium active:bg-black/5"
                    >
                      <Phone size={16} /> Call
                    </a>
                  ) : (
                    <span />
                  )}
                  <a
                    href={mapsUrl(destination)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-black/10 py-3 text-sm font-medium active:bg-black/5"
                  >
                    <Navigation size={16} /> Directions
                  </a>
                </div>
              )}

              {next && (
                <button
                  type="button"
                  disabled={updatingId === ride.id}
                  onClick={() => advance(ride, next)}
                  className="mt-2 w-full rounded-xl bg-brand-gold py-3.5 text-base font-semibold text-brand-black active:opacity-80 disabled:opacity-50"
                >
                  {updatingId === ride.id ? 'Updating…' : NEXT_LABEL[next]}
                </button>
              )}

              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : ride.id)}
                className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-black/45"
              >
                {isOpen ? 'Hide details' : 'Details'}
                <ChevronDown size={14} className={isOpen ? 'rotate-180' : ''} />
              </button>
              {isOpen && <RideDetails ride={ride} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
