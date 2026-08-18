import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, ChevronRight } from 'lucide-react'
import { admin as adminApi } from '../utils/api'
import { formatCurrency } from '../utils/helpers'

const SORT_OPTIONS = {
  name: { label: 'Name (A–Z)', compare: (a, b) => (a.name || '').localeCompare(b.name || '') },
  bookings: { label: 'Most Bookings', compare: (a, b) => b.total_bookings - a.total_bookings },
  revenue: { label: 'Highest Revenue', compare: (a, b) => b.completed_revenue - a.completed_revenue },
  upcoming: { label: 'Most Upcoming', compare: (a, b) => b.upcoming_count - a.upcoming_count },
  newest: { label: 'Newest First', compare: (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) },
}

// Shared table for the separate Drivers and Providers admin pages — same
// shape as the old combined "Drivers & Providers" page, just fixed to one
// role instead of toggling between them, and each row now links to that
// person's own detail page (/admin/drivers/:id or /admin/providers/:id)
// instead of opening a modal — so admin can land straight on a specific
// person's page (bookmark it, download their report) rather than always
// starting from the list.
export default function AdminPeopleList({ role }) {
  const [list, setList] = useState([])
  const [commissionRate, setCommissionRate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')

  function load() {
    setLoading(true)
    setError('')
    adminApi
      .stats(role)
      .then((data) => {
        setList(data.users || [])
        setCommissionRate(data.commission_rate)
      })
      .catch((err) => setError(err.message || 'Failed to load stats'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setSelectedId('')
    setSearch('')
    setStatusFilter('')
    setSortBy('name')
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const filtered = useMemo(() => {
    let rows = list
    if (selectedId) rows = rows.filter((u) => String(u.id) === String(selectedId))
    else if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q),
      )
    }
    if (statusFilter) rows = rows.filter((u) => u.status === statusFilter)
    const sorter = SORT_OPTIONS[sortBy] || SORT_OPTIONS.name
    return [...rows].sort(sorter.compare)
  }, [list, search, selectedId, statusFilter, sortBy])

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, u) => ({
          total_bookings: acc.total_bookings + u.total_bookings,
          completed_count: acc.completed_count + u.completed_count,
          upcoming_count: acc.upcoming_count + u.upcoming_count,
          completed_revenue: acc.completed_revenue + u.completed_revenue,
          driver_payout: acc.driver_payout + (u.driver_payout || 0),
          admin_margin: acc.admin_margin + (u.admin_margin || 0),
        }),
        { total_bookings: 0, completed_count: 0, upcoming_count: 0, completed_revenue: 0, driver_payout: 0, admin_margin: 0 },
      ),
    [filtered],
  )

  return (
    <section>
      <p className="text-sm text-brand-black/50">
        {role === 'driver'
          ? `Ride counts and payout per driver. Drivers are paid ${Math.round((commissionRate || 0.75) * 100)}% of completed-ride revenue; the remainder is the admin's margin.`
          : 'Booking counts and revenue generated per provider (providers place bookings on behalf of their own clients).'}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-black/30" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedId('')
            }}
            placeholder={`Search ${role}s by name, email, or phone…`}
            className="w-full border border-brand-black/15 py-2 pl-8 pr-3 text-sm"
          />
        </div>
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value)
            setSearch('')
          }}
          className="border border-brand-black/15 px-3 py-2 text-sm"
        >
          <option value="">— Look up a single {role} —</option>
          {list.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-brand-black/15 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-brand-black/15 px-3 py-2 text-sm"
        >
          {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
            <option key={key} value={key}>Sort: {opt.label}</option>
          ))}
        </select>
        {(search || selectedId || statusFilter || sortBy !== 'name') && (
          <button
            onClick={() => {
              setSearch('')
              setSelectedId('')
              setStatusFilter('')
              setSortBy('name')
            }}
            className="flex items-center gap-1 text-xs text-brand-black/50 hover:text-brand-black"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
      {error && <p className="mt-8 text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          <div className={`mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 ${role === 'driver' ? 'lg:grid-cols-6' : 'lg:grid-cols-4'}`}>
            <StatCard label="Total Bookings" value={totals.total_bookings} />
            <StatCard label="Completed" value={totals.completed_count} />
            <StatCard label="Upcoming" value={totals.upcoming_count} />
            <StatCard label={role === 'driver' ? 'Completed Fare Value' : 'Revenue Generated'} value={formatCurrency(totals.completed_revenue)} />
            {role === 'driver' && <StatCard label="Driver Payout" value={formatCurrency(totals.driver_payout)} />}
            <StatCard label="Admin Margin" value={formatCurrency(totals.admin_margin)} />
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-black/10 text-left text-brand-black/50">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Completed</th>
                  <th className="py-2 pr-4">Upcoming</th>
                  <th className="py-2 pr-4">Cancelled</th>
                  <th className="py-2 pr-4">{role === 'driver' ? 'Fare Value' : 'Revenue'}</th>
                  {role === 'driver' && <th className="py-2 pr-4">Payout</th>}
                  <th className="py-2 pr-4">Admin Margin</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-brand-black/5 hover:bg-brand-black/[0.03]"
                  >
                    <td className="p-0">
                      <Link to={`/admin/${role}s/${u.id}`} className="flex w-full items-center py-2 pr-4">
                        {u.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                          u.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-brand-black/60">
                      <div>{u.email}</div>
                      {u.phone && <div className="text-xs">{u.phone}</div>}
                    </td>
                    <td className="py-2 pr-4">{u.total_bookings}</td>
                    <td className="py-2 pr-4">{u.completed_count}</td>
                    <td className="py-2 pr-4">{u.upcoming_count}</td>
                    <td className="py-2 pr-4">{u.cancelled_count}</td>
                    <td className="py-2 pr-4">{formatCurrency(u.completed_revenue)}</td>
                    {role === 'driver' && <td className="py-2 pr-4">{formatCurrency(u.driver_payout)}</td>}
                    <td className="py-2 pr-4">{formatCurrency(u.admin_margin)}</td>
                    <td className="py-2 pr-4 text-brand-black/30">
                      <Link to={`/admin/${role}s/${u.id}`}>
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <p className="py-8 text-brand-black/50">No {role}s found{search ? ' matching that search' : ''}.</p>
            )}
          </div>
        </>
      )}
    </section>
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
