import { useEffect, useState } from 'react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import { bookings as bookingsApi } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'

export default function CustomerDashboard() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  function load() {
    bookingsApi
      .my()
      .then(setList)
      .catch((err) => setError(err.message || 'Failed to load bookings'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleCancel(id) {
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

  const upcoming = list.filter((b) => b.booking_status !== 'completed' && b.booking_status !== 'cancelled')
  const past = list.filter((b) => b.booking_status === 'completed' || b.booking_status === 'cancelled')

  return (
    <div>
      <PageMeta title="Dashboard" description="Your BlackStone Chauffeur bookings." />

      <section className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl text-brand-black">My Bookings</h1>
          <Button to="/booking">New Booking</Button>
        </div>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && <p className="mt-8 text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            <h2 className="mt-10 font-heading text-xl text-brand-black">Upcoming</h2>
            <BookingTable
              rows={upcoming}
              empty="No upcoming bookings."
              onCancel={handleCancel}
              cancellingId={cancellingId}
            />

            <h2 className="mt-10 font-heading text-xl text-brand-black">Past</h2>
            <BookingTable rows={past} empty="No past bookings yet." />
          </>
        )}
      </section>
    </div>
  )
}

function BookingTable({ rows, empty, onCancel, cancellingId }) {
  if (!rows.length) return <p className="mt-4 text-sm text-brand-black/50">{empty}</p>

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-brand-black/10 text-left text-brand-black/50">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Pickup</th>
            <th className="py-2 pr-4">Drop-off</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Total</th>
            {onCancel && <th className="py-2 pr-4">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-b border-brand-black/5">
              <td className="py-2 pr-4">{formatDate(b.date)}</td>
              <td className="py-2 pr-4">{b.pickup}</td>
              <td className="py-2 pr-4">{b.dropoff}</td>
              <td className="py-2 pr-4"><StatusBadge status={b.booking_status} /></td>
              <td className="py-2 pr-4">{formatCurrency(b.total_price)}</td>
              {onCancel && (
                <td className="py-2 pr-4">
                  {!['completed', 'cancelled'].includes(b.booking_status) && (
                    <button
                      disabled={cancellingId === b.id}
                      onClick={() => onCancel(b.id)}
                      className="text-xs text-red-500 hover:underline disabled:opacity-40"
                    >
                      {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
