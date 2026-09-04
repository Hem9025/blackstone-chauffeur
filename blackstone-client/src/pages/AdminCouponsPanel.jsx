import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import { coupons as couponsApi } from '../utils/api'
import { formatCurrency } from '../utils/helpers'

const BLANK_FORM = {
  code: '',
  discount_type: 'percent',
  discount_value: '',
  min_fare: '',
  max_discount: '',
  max_uses: '',
  max_uses_per_customer: '',
  expires_at: '',
  active: true,
}

// Server stores expires_at as a full DATETIME; the form's <input type="date">
// only wants YYYY-MM-DD — these two round-trip between the two shapes, same
// role vehicleToForm/rowsToTiers play in AdminVehiclesPanel.jsx.
function couponToForm(c) {
  return {
    code: c.code || '',
    discount_type: c.discount_type || 'percent',
    discount_value: c.discount_value ?? '',
    min_fare: c.min_fare ?? '',
    max_discount: c.max_discount ?? '',
    max_uses: c.max_uses ?? '',
    max_uses_per_customer: c.max_uses_per_customer ?? '',
    expires_at: c.expires_at ? String(c.expires_at).slice(0, 10) : '',
    active: c.active !== false,
  }
}

export default function AdminCouponsPanel() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // editingId === 'new' means the create form; null means the panel is closed.
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)

  function load() {
    setLoading(true)
    couponsApi
      .list()
      .then(setList)
      .catch((err) => setError(err.message || 'Failed to load coupons'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openCreate() {
    setForm(BLANK_FORM)
    setEditingId('new')
    setError('')
  }

  function openEdit(c) {
    setForm(couponToForm(c))
    setEditingId(c.id)
    setError('')
  }

  function closeForm() {
    setEditingId(null)
  }

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: field === 'code' ? value.toUpperCase() : value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      code: form.code.trim(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      min_fare: form.min_fare === '' ? 0 : Number(form.min_fare),
      max_discount: form.max_discount === '' ? null : Number(form.max_discount),
      max_uses: form.max_uses === '' ? null : Number(form.max_uses),
      max_uses_per_customer: form.max_uses_per_customer === '' ? null : Number(form.max_uses_per_customer),
      expires_at: form.expires_at || null,
      active: form.active,
    }

    try {
      if (editingId === 'new') {
        await couponsApi.create(payload)
      } else {
        await couponsApi.update(editingId, payload)
      }
      closeForm()
      load()
    } catch (err) {
      setError(err.message || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(c) {
    try {
      await couponsApi.update(c.id, { active: !c.active })
      load()
    } catch (err) {
      setError(err.message || 'Failed to update coupon')
    }
  }

  function isExpired(c) {
    return c.expires_at && new Date(c.expires_at) < new Date()
  }

  return (
    <div>
      <PageMeta title="Manage Coupons" description="Discount codes — BlackStone Chauffeur admin." />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl text-brand-black">Coupons</h1>
          <Button onClick={openCreate} className="!px-4 !py-2 text-sm">
            <Plus size={16} className="mr-1" /> Add Coupon
          </Button>
        </div>
        <p className="mt-2 text-sm text-brand-black/50">
          Discount codes customers can apply on the Booking page. Only used on the
          instant-online-booking flow — provider/admin-created bookings are priced manually and
          don't use these. "Max uses per customer" limits how many times one signed-in account
          (one email) can redeem a given code, separate from the total across everyone.
        </p>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && editingId === null && <p className="mt-8 text-red-500">{error}</p>}

        {!loading && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-black/10 text-left text-brand-black/50">
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Discount</th>
                  <th className="py-2 pr-4">Min Fare</th>
                  <th className="py-2 pr-4">Uses</th>
                  <th className="py-2 pr-4">Expires</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-b border-brand-black/5">
                    <td className="py-2 pr-4 font-medium">{c.code}</td>
                    <td className="py-2 pr-4">
                      {c.discount_type === 'percent' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}
                      {c.max_discount != null && c.discount_type === 'percent' && (
                        <span className="text-brand-black/40"> (max {formatCurrency(c.max_discount)})</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{Number(c.min_fare) > 0 ? formatCurrency(c.min_fare) : '—'}</td>
                    <td className="py-2 pr-4">
                      {c.uses_count}{c.max_uses != null ? ` / ${c.max_uses}` : ''}
                      {c.max_uses_per_customer != null && (
                        <span className="text-brand-black/40"> (max {c.max_uses_per_customer}/customer)</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {c.expires_at ? (
                        <span className={isExpired(c) ? 'text-red-500' : ''}>{String(c.expires_at).slice(0, 10)}</span>
                      ) : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`text-xs ${c.active && !isExpired(c) ? 'text-green-600' : 'text-brand-black/40'}`}
                      >
                        {!c.active ? 'Inactive' : isExpired(c) ? 'Expired' : 'Active'}
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => openEdit(c)}
                        className="border border-brand-gold px-3 py-1 text-xs text-brand-gold hover:bg-brand-gold hover:text-brand-black"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <p className="py-8 text-brand-black/50">No coupons yet.</p>}
          </div>
        )}

        {editingId !== null && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10">
            <div className="w-full max-w-lg bg-white p-6 md:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl text-brand-black">
                  {editingId === 'new' ? 'Add Coupon' : 'Edit Coupon'}
                </h2>
                <button onClick={closeForm} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <label className="text-xs text-brand-black/50">
                  Code
                  <input
                    required
                    placeholder="e.g. WELCOME10"
                    value={form.code}
                    onChange={update('code')}
                    className="mt-1 w-full border border-brand-black/15 px-3 py-2 uppercase"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="text-xs text-brand-black/50">
                    Discount Type
                    <select
                      value={form.discount_type}
                      onChange={update('discount_type')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    >
                      <option value="percent">Percent (%)</option>
                      <option value="fixed">Fixed amount ($)</option>
                    </select>
                  </label>
                  <label className="text-xs text-brand-black/50">
                    Discount Value
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      max={form.discount_type === 'percent' ? 100 : undefined}
                      value={form.discount_value}
                      onChange={update('discount_value')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="text-xs text-brand-black/50">
                    Minimum fare (optional)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="No minimum"
                      value={form.min_fare}
                      onChange={update('min_fare')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                  {form.discount_type === 'percent' && (
                    <label className="text-xs text-brand-black/50">
                      Max discount $ (optional)
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Uncapped"
                        value={form.max_discount}
                        onChange={update('max_discount')}
                        className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="text-xs text-brand-black/50">
                    Max total uses (optional)
                    <input
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={form.max_uses}
                      onChange={update('max_uses')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs text-brand-black/50">
                    Max uses per customer (optional)
                    <input
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={form.max_uses_per_customer}
                      onChange={update('max_uses_per_customer')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                </div>

                <label className="text-xs text-brand-black/50">
                  Expires (optional)
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={update('expires_at')}
                    className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                  />
                </label>

                <label className="flex items-center gap-2 text-sm text-brand-black">
                  <input type="checkbox" checked={form.active} onChange={update('active')} />
                  Active (customers can apply this code at checkout)
                </label>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="mt-2 flex gap-3">
                  <Button type="submit" disabled={saving} className="!px-6 !py-2 text-sm">
                    {saving ? 'Saving…' : 'Save Coupon'}
                  </Button>
                  <button type="button" onClick={closeForm} className="text-sm text-brand-black/50">
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
