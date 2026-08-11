import { useEffect, useState } from 'react'
import PageMeta from '../components/PageMeta'
import { admin as adminApi } from '../utils/api'
import { formatCurrency } from '../utils/helpers'

const STATUS_LABELS = {
  pending: 'Pending',
  assigned: 'Assigned',
  en_route: 'En Route',
  arrived: 'Arrived',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
const STATUS_ORDER = ['pending', 'assigned', 'en_route', 'arrived', 'completed', 'cancelled']

function monthLabel(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-NZ', { month: 'short' })
}

export default function AdminDashboardPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Toggles the monthly chart between booking volume and revenue — both are
  // useful, but rarely at the same time, so one chart that switches beats
  // two competing for space.
  const [metric, setMetric] = useState('revenue')

  useEffect(() => {
    adminApi
      .overview()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageMeta title="Dashboard" description="Revenue and booking overview — BlackStone Chauffeur admin." />

      <section>
        <h1 className="font-heading text-3xl text-brand-black">Dashboard</h1>
        <p className="mt-2 text-sm text-brand-black/50">A quick read on how the business is doing, updated live.</p>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && <p className="mt-8 text-red-500">{error}</p>}

        {data && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Total Revenue" value={formatCurrency(data.total_revenue)} />
              <StatCard label="Total Bookings" value={data.total_bookings} />
              <StatCard label="Completed" value={data.completed_count} />
              <StatCard label="Upcoming" value={data.upcoming_count} />
              <StatCard label="Cancelled" value={data.cancelled_count} />
              <StatCard label="Avg Booking Value" value={formatCurrency(data.avg_booking_value)} />
            </div>

            {/* Monthly trend */}
            <div className="mt-8 border border-brand-black/10 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-heading text-base text-brand-black">Last 12 Months</p>
                <div className="flex border border-brand-black/15 text-xs">
                  <button
                    onClick={() => setMetric('revenue')}
                    className={`px-3 py-1.5 ${metric === 'revenue' ? 'bg-brand-black text-white' : 'text-brand-black/60'}`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setMetric('bookings')}
                    className={`px-3 py-1.5 ${metric === 'bookings' ? 'bg-brand-black text-white' : 'text-brand-black/60'}`}
                  >
                    Bookings
                  </button>
                </div>
              </div>
              <MonthlyBarChart trend={data.monthly_trend} metric={metric} />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Status breakdown */}
              <div className="border border-brand-black/10 bg-white p-5">
                <p className="font-heading text-base text-brand-black">Bookings by Status</p>
                <div className="mt-4 flex flex-col gap-3">
                  {STATUS_ORDER.map((status) => {
                    const count = data.status_breakdown[status] || 0
                    const max = Math.max(1, ...STATUS_ORDER.map((s) => data.status_breakdown[s] || 0))
                    return (
                      <div key={status} className="flex items-center gap-3 text-sm">
                        <span className="w-20 shrink-0 text-brand-black/60">{STATUS_LABELS[status]}</span>
                        <div className="h-2 flex-1 bg-black/5">
                          <div
                            className="h-full bg-brand-gold"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right text-brand-black">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top vehicles */}
              <div className="border border-brand-black/10 bg-white p-5">
                <p className="font-heading text-base text-brand-black">Top Vehicles</p>
                {data.top_vehicles.length === 0 ? (
                  <p className="mt-4 text-sm text-brand-black/40">No bookings yet.</p>
                ) : (
                  <table className="mt-4 w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-black/10 text-left text-brand-black/50">
                        <th className="py-2 pr-4">Vehicle</th>
                        <th className="py-2 pr-4">Bookings</th>
                        <th className="py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_vehicles.map((v) => (
                        <tr key={v.name} className="border-b border-brand-black/5 last:border-0">
                          <td className="py-2 pr-4 text-brand-black">{v.name}</td>
                          <td className="py-2 pr-4 text-brand-black/70">{v.bookings}</td>
                          <td className="py-2 text-brand-black/70">{formatCurrency(v.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </section>
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

// Plain CSS bars rather than a charting library — 12 fixed data points
// never needs more than this, and it keeps the bundle from growing to
// support one chart.
function MonthlyBarChart({ trend, metric }) {
  const values = trend.map((t) => t[metric])
  const max = Math.max(1, ...values)

  return (
    <div className="mt-6 flex h-40 items-end gap-2">
      {trend.map((t) => {
        const value = t[metric]
        const heightPct = (value / max) * 100
        return (
          <div key={t.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end">
              <div
                className="w-full bg-brand-gold transition-all"
                style={{ height: `${Math.max(heightPct, value > 0 ? 3 : 0)}%` }}
                title={metric === 'revenue' ? formatCurrency(value) : `${value} bookings`}
              />
            </div>
            <span className="text-[11px] text-brand-black/40">{monthLabel(t.month)}</span>
          </div>
        )
      })}
    </div>
  )
}
