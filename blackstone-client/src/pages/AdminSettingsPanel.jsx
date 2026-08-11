import { useEffect, useState } from 'react'
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

export default function AdminSettingsPanel() {
  const [values, setValues] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingFlag, setSavingFlag] = useState(null)

  useEffect(() => {
    permissionsApi
      .get()
      .then(setValues)
      .catch((err) => setError(err.message || 'Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

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

  return (
    <div>
      <PageMeta title="Second Admin Management" description="Second admin permissions — BlackStone Chauffeur admin." />

      <section className="max-w-2xl">
        <h1 className="font-heading text-3xl text-brand-black">Second Admin Management</h1>
        <p className="mt-2 text-sm text-brand-black/50">
          Control what a Second Admin account can see and do. These toggles never affect your own
          access — admin always has full access to everything.
        </p>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {values && (
          <div className="mt-8 flex flex-col divide-y divide-black/10 border border-black/10 bg-white">
            {TOGGLES.map((t) => (
              <div key={t.flag} className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="font-medium text-brand-black">{t.label}</p>
                  <p className="mt-1 text-sm text-black/50">{t.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={values[t.flag]}
                  disabled={savingFlag === t.flag}
                  onClick={() => toggle(t.flag)}
                  className={`relative mt-1 flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                    values[t.flag] ? 'bg-brand-gold' : 'bg-black/15'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      values[t.flag] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
