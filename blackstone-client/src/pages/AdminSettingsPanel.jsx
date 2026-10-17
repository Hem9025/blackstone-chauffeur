import { useEffect, useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import { permissions as permissionsApi } from '../utils/api'

const TOGGLES = [
  {
    flag: 'can_manage_bookings',
    label: 'Bookings',
    desc: 'View, edit, cancel and delete bookings, assign drivers, and create bookings on a client\'s behalf.',
  },
  {
    flag: 'can_manage_vehicles',
    label: 'Vehicles',
    desc: 'Add, edit, price, and deactivate fleet vehicles.',
  },
  {
    flag: 'can_manage_users',
    label: 'Users',
    desc: 'Create accounts, approve pending drivers, and change user roles. (Granting admin/second_admin access always stays admin-only, regardless of this toggle.)',
  },
  {
    flag: 'can_view_stats',
    label: 'Drivers & Providers (revenue)',
    desc: 'Per-driver and per-provider booking counts, revenue, and payout figures, plus provider payment tracking.',
  },
]

function Toggle({ checked, disabled, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={`relative mt-1 flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-brand-gold' : 'bg-black/15'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function AdminSettingsPanel() {
  const [values, setValues] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingFlag, setSavingFlag] = useState(null)

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [savingUserFlag, setSavingUserFlag] = useState(null)

  useEffect(() => {
    permissionsApi
      .get()
      .then(setValues)
      .catch((err) => setError(err.message || 'Failed to load settings'))
      .finally(() => setLoading(false))
    loadUsers()
  }, [])

  function loadUsers() {
    setLoadingUsers(true)
    permissionsApi
      .listUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false))
  }

  async function toggle(flag) {
    if (!values) return
    const next = !values[flag]
    setSavingFlag(flag)
    setError('')
    // Optimistic update — reverted below if the request fails.
    setValues((v) => ({ ...v, [flag]: next }))
    try {
      const updated = await permissionsApi.update({ [flag]: next })
      setValues(updated)
    } catch (err) {
      setValues((v) => ({ ...v, [flag]: !next }))
      setError(err.message || 'Failed to update setting')
    } finally {
      setSavingFlag(null)
    }
  }

  async function toggleUserFlag(user, flag) {
    const key = `${user.id}:${flag}`
    const next = !user.permissions[flag]
    setSavingUserFlag(key)
    // Optimistic update.
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, permissions: { ...u.permissions, [flag]: next }, customized: true } : u)),
    )
    try {
      const updated = await permissionsApi.updateUser(user.id, { [flag]: next })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, permissions: updated.permissions, customized: updated.customized } : u)))
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, permissions: { ...u.permissions, [flag]: !next } } : u)),
      )
    } finally {
      setSavingUserFlag(null)
    }
  }

  async function resetUser(user) {
    setSavingUserFlag(`${user.id}:reset`)
    try {
      const updated = await permissionsApi.resetUser(user.id)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, permissions: updated.permissions, customized: updated.customized } : u)))
    } catch {
      // Leave as-is — they can retry.
    } finally {
      setSavingUserFlag(null)
    }
  }

  return (
    <div>
      <PageMeta title="Second Admin Management" description="Second admin permissions — BlackStone Chauffeur admin." />

      <section className="max-w-2xl">
        <h1 className="font-heading text-3xl text-brand-black">Second Admin Management</h1>
        <p className="mt-2 text-sm text-brand-black/50">
          Control what a Second Admin account can see and do. These toggles never affect your own
          access — admin always has full access to everything.
        </p>

        <h2 className="mt-10 font-heading text-lg text-brand-black">Default Access</h2>
        <p className="mt-1 text-sm text-brand-black/50">
          Applies to every second admin, except any you've given their own settings below.
        </p>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {values && (
          <div className="mt-4 flex flex-col divide-y divide-black/10 border border-black/10 bg-white">
            {TOGGLES.map((t) => (
              <div key={t.flag} className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="font-medium text-brand-black">{t.label}</p>
                  <p className="mt-1 text-sm text-black/50">{t.desc}</p>
                </div>
                <Toggle checked={values[t.flag]} disabled={savingFlag === t.flag} onClick={() => toggle(t.flag)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="font-heading text-lg text-brand-black">Individual Overrides</h2>
        <p className="mt-1 text-sm text-brand-black/50">
          Give a specific second admin their own access instead of the default above — useful if
          one person should see more (or less) than the rest. Everyone here starts out on the
          default; expand a name to customize just for them.
        </p>

        {loadingUsers && <p className="mt-6 text-brand-black/50">Loading…</p>}
        {!loadingUsers && !users.length && (
          <p className="mt-6 text-sm text-brand-black/50">No second admin accounts yet.</p>
        )}

        {!loadingUsers && users.length > 0 && (
          <div className="mt-4 flex flex-col divide-y divide-black/10 border border-black/10 bg-white">
            {users.map((u) => {
              const isOpen = expandedId === u.id
              return (
                <div key={u.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : u.id)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-black/[0.02]"
                  >
                    <div>
                      <p className="font-medium text-brand-black">
                        {u.name}
                        {u.customized && (
                          <span className="ml-2 rounded-full bg-brand-gold/15 px-2 py-0.5 text-[11px] font-normal text-brand-gold">
                            Customized
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-black/50">{u.email}</p>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 text-black/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="border-t border-black/10 bg-black/[0.015] px-5 pb-5">
                      {u.customized && (
                        <button
                          type="button"
                          onClick={() => resetUser(u)}
                          disabled={savingUserFlag === `${u.id}:reset`}
                          className="mt-4 flex items-center gap-1.5 text-xs text-brand-black/50 hover:text-brand-black disabled:opacity-50"
                        >
                          <RotateCcw size={12} /> Reset to default
                        </button>
                      )}
                      <div className="mt-2 flex flex-col divide-y divide-black/10">
                        {TOGGLES.map((t) => (
                          <div key={t.flag} className="flex items-start justify-between gap-4 py-4">
                            <div>
                              <p className="text-sm font-medium text-brand-black">{t.label}</p>
                              <p className="mt-1 text-xs text-black/50">{t.desc}</p>
                            </div>
                            <Toggle
                              checked={u.permissions[t.flag]}
                              disabled={savingUserFlag === `${u.id}:${t.flag}`}
                              onClick={() => toggleUserFlag(u, t.flag)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
