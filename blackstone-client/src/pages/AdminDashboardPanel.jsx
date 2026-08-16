import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import { admin as adminApi, bookings as bookingsApi } from '../utils/api'
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

// Local YYYY-MM-DD (not toISOString, which is UTC and can land on the
// wrong calendar day this far from UTC) — used to deep-link the "Today's
// Bookings" card to the bookings list pre-filtered to today's date.
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

  const today = todayISO()
  // Last 6 months only for the chart, even though the API returns 12 — a
  // shorter window reads more clearly at a glance, matching what the client
  // asked for ("Revenue – Last 6 Months").
  const last6Months = data?.monthly_trend?.slice(-6) || []

  return (
    <div>
      <PageMeta title="Dashboard" description="Revenue and booking overview — BlackStone Chauffeur admin." />

      <section>
        <h1 className="font-heading text-3xl text-brand-black">Dashboard</h1>
        <p className="mt-2 text-sm text-brand-black/50">A live read on bookings and revenue, pulled straight from the database.</p>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && <p className="mt-8 text-red-500">{error}</p>}

        {data && (
          <>
            {/* Booking Overview */}
            <p className="mt-10 font-heading text-lg text-brand-black">Booking Overview</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
              <StatCard label="Total Bookings" value={data.total_bookings} to="/admin" />
              {STATUS_ORDER.map((status) => (
                <StatCard
                  key={status}
                  label={STATUS_LABELS[status]}
                  value={data.status_breakdown[status] || 0}
                  to={`/admin?status=${status}`}
                />
              ))}
              <StatCard label="Today's Bookings" value={data.today_bookings_count} to={`/admin?date_from=${today}&date_to=${today}`} />
              <StatCard label="Total Drivers" value={data.total_drivers} to="/admin/drivers" />
              <StatCard label="Fleet Vehicles" value={data.total_vehicles} to="/admin/vehicles" />
            </div>

            {/* Financial Summary */}
            <p className="mt-10 font-heading text-lg text-brand-black">Financial Summary</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Total Revenue" value={formatCurrency(data.total_revenue)} />
              <StatCard label="This Month" value={formatCurrency(data.revenue_this_month)} />
              <StatCard label="Invoices Paid" value={formatCurrency(data.invoices.paid_amount)} to="/admin?payment_status=paid" />
              <StatCard label="Invoices Unpaid" value={formatCurrency(data.invoices.unpaid_amount)} to="/admin?payment_status=pending" />
              <StatCard label="Total Customers" value={data.total_customers} to="/admin/users" />
            </div>

            {/* Monthly trend */}
            <div className="mt-8 border border-brand-black/10 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-heading text-base text-brand-black">Revenue — Last 6 Months</p>
                <div className="flex items-center gap-3">
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
                  <button
                    onClick={() => bookingsApi.downloadAllReport()}
                    className="flex items-center gap-1.5 text-xs text-brand-gold hover:underline"
                  >
                    <Download size={13} /> Full Report
                  </button>
                </div>
              </div>
              <MonthlyBarChart trend={last6Months} metric={metric} />
            </div>

            {/* Invoices */}
            <p className="mt-10 font-heading text-lg text-brand-black">Invoices</p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <StatCard label="Total Invoices" value={data.invoices.total} to="/admin" />
              <StatCard label="Paid Invoices" value={data.invoices.paid_count} to="/admin?payment_status=paid" />
              <StatCard label="Unpaid Invoices" value={data.invoices.unpaid_count} to="/admin?payment_status=pending" />
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

// `to` is optional — cards without a sensible destination (e.g. Total
// Revenue, which has no dedicated filtered view) just render as a plain
// stat, while the rest link straight into a pre-filtered bookings/users
// list so the number is never a dead end.
function StatCard({ label, value, to }) {
  const content = (
    <>
      <p className="text-xs text-brand-black/50">{label}</p>
      <p className="mt-1 font-heading text-xl text-brand-black">{value}</p>
    </>
  )
  if (!to) {
    return <div className="border border-brand-black/10 bg-white p-4">{content}</div>
  }
  return (
    <Link to={to} className="block border border-brand-black/10 bg-white p-4 transition-colors hover:border-brand-gold/50 hover:bg-brand-gold/5">
      {content}
    </Link>
  )
}

// Plain CSS bars rather than a charting library — 6 fixed data points never
// needs more than this, and it keeps the bundle from growing to support
// one chart.
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
