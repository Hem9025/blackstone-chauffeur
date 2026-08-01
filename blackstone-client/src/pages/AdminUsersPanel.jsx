import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import { admin as adminApi } from '../utils/api'

const ROLES = ['customer', 'driver', 'provider', 'second_admin', 'admin']
const CREATABLE_ROLES = ['customer', 'driver', 'provider']

const BLANK_FORM = { name: '', email: '', phone: '', password: '', role: 'provider' }

export default function AdminUsersPanel() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  function load() {
    setLoading(true)
    adminApi
      .users()
      .then(setList)
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function approve(id) {
    setBusyId(id)
    try {
      await adminApi.approveUser(id)
      load()
    } catch (err) {
      setError(err.message || 'Failed to approve user')
    } finally {
      setBusyId(null)
    }
  }

  async function changeRole(id, role) {
    setBusyId(id)
    try {
      await adminApi.changeRole(id, role)
      load()
    } catch (err) {
      setError(err.message || 'Failed to change role')
    } finally {
      setBusyId(null)
    }
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function openCreate() {
    setForm(BLANK_FORM)
    setCreateError('')
    setShowCreate(true)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      await adminApi.createUser(form)
      setShowCreate(false)
      load()
    } catch (err) {
      setCreateError(err.message || 'Failed to create account')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <PageMeta title="Manage Users" description="User management — BlackStone Chauffeur admin." />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl text-brand-black">User Management</h1>
          <Button onClick={openCreate} className="!px-4 !py-2 text-sm">
            <Plus size={16} className="mr-1" /> Create Account
          </Button>
        </div>
        <p className="mt-2 text-sm text-brand-black/50">
          Create driver, provider, or customer accounts directly — useful for providers, since
          there's no public sign-up form for that role.
        </p>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && <p className="mt-8 text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-black/10 text-left text-brand-black/50">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="border-b border-brand-black/5">
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">
                      <select
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="border border-brand-black/15 px-2 py-1"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-4 capitalize">{u.status}</td>
                    <td className="py-2 pr-4">
                      {u.status === 'pending' && (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => approve(u.id)}
                          className="border border-brand-gold px-3 py-1 text-xs text-brand-gold hover:bg-brand-gold hover:text-brand-black disabled:opacity-40"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10">
            <div className="w-full max-w-md bg-white p-6 md:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl text-brand-black">Create Account</h2>
                <button onClick={() => setShowCreate(false)} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4">
                <select
                  value={form.role}
                  onChange={update('role')}
                  className="border border-brand-black/15 px-3 py-2"
                >
                  {CREATABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <input
                  required
                  placeholder="Full name"
                  value={form.name}
                  onChange={update('name')}
                  className="border border-brand-black/15 px-3 py-2"
                />
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={update('email')}
                  className="border border-brand-black/15 px-3 py-2"
                />
                <input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={update('phone')}
                  className="border border-brand-black/15 px-3 py-2"
                />
                <input
                  required
                  type="password"
                  placeholder="Temporary password"
                  value={form.password}
                  onChange={update('password')}
                  className="border border-brand-black/15 px-3 py-2"
                />

                {createError && <p className="text-sm text-red-500">{createError}</p>}

                <div className="mt-2 flex gap-3">
                  <Button type="submit" disabled={creating} className="!px-6 !py-2 text-sm">
                    {creating ? 'Creating…' : 'Create Account'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="text-sm text-brand-black/50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
