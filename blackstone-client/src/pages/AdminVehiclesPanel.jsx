import { useEffect, useState } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import { admin as adminApi, vehicles as vehiclesApi } from '../utils/api'
import { formatCurrency } from '../utils/helpers'

const VEHICLE_TYPES = ['economy', 'business']

const BLANK_FORM = {
  name: '',
  type: 'economy',
  description: '',
  image_url: '',
  capacity: 4,
  passengers: 4,
  suitcases: 2,
  owned: 1,
  starting_price: 0,
  price_per_minute: 0,
  price_per_occupant: 0,
  price_per_suitcase: 0,
  features: '',
  active: true,
}

const BLANK_TIER = { min: '', max: '', price: '' }

// These three functions round-trip between the shape the server stores
// (vehicles.distance_tiers as a JSON array of {min,max,price}; features as
// a JSON array of strings) and the shape this form's plain <input>s can
// edit (comma-separated text; one row per tier). vehicleToForm/tiersToRows
// go server -> form when opening the edit panel; rowsToTiers goes back
// form -> server in handleSubmit below.
function vehicleToForm(v) {
  return {
    name: v.name || '',
    type: v.type || 'economy',
    description: v.description || '',
    image_url: v.image_url || '',
    capacity: v.capacity ?? 4,
    passengers: v.passengers ?? 4,
    suitcases: v.suitcases ?? 2,
    owned: v.owned ?? 1,
    starting_price: v.starting_price ?? 0,
    price_per_minute: v.price_per_minute ?? 0,
    price_per_occupant: v.price_per_occupant ?? 0,
    price_per_suitcase: v.price_per_suitcase ?? 0,
    features: Array.isArray(v.features) ? v.features.join(', ') : '',
    active: v.active !== false,
  }
}

function tiersToRows(tiers) {
  if (!Array.isArray(tiers) || !tiers.length) return [{ ...BLANK_TIER }]
  return tiers.map((t) => ({
    min: t.min ?? '',
    max: t.max === null || t.max === undefined ? '' : t.max,
    price: t.price ?? '',
  }))
}

function rowsToTiers(rows) {
  return rows
    .filter((r) => r.min !== '' && r.price !== '')
    .map((r) => ({
      min: Number(r.min),
      max: r.max === '' ? null : Number(r.max),
      price: Number(r.price),
    }))
}

export default function AdminVehiclesPanel() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // editingId === 'new' means the create form; null means the panel is closed.
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [tierRows, setTierRows] = useState([{ ...BLANK_TIER }])

  function load() {
    setLoading(true)
    adminApi
      .vehicles()
      .then(setList)
      .catch((err) => setError(err.message || 'Failed to load vehicles'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openCreate() {
    setForm(BLANK_FORM)
    setTierRows([{ ...BLANK_TIER }])
    setEditingId('new')
    setError('')
  }

  function openEdit(v) {
    setForm(vehicleToForm(v))
    setTierRows(tiersToRows(v.distance_tiers))
    setEditingId(v.id)
    setError('')
  }

  function closeForm() {
    setEditingId(null)
  }

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: value }))
    }
  }

  function updateTierRow(index, field) {
    return (e) => {
      const value = e.target.value
      setTierRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
    }
  }

  function addTierRow() {
    setTierRows((rows) => [...rows, { ...BLANK_TIER }])
  }

  function removeTierRow(index) {
    setTierRows((rows) => rows.filter((_, i) => i !== index))
  }

  // Builds the update/create payload by spreading `form` — which only ever
  // holds the fixed set of keys in BLANK_FORM, never arbitrary ones — so
  // this UI can only ever send a known, well-formed set of fields to the
  // server. (The server's PATCH /api/vehicles/:id still whitelists columns
  // independently rather than trusting that — see that route's comments —
  // since this form isn't the only way to reach that endpoint.)
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      capacity: Number(form.capacity) || 0,
      passengers: Number(form.passengers) || 0,
      suitcases: Number(form.suitcases) || 0,
      owned: Number(form.owned) || 0,
      starting_price: Number(form.starting_price) || 0,
      price_per_minute: Number(form.price_per_minute) || 0,
      price_per_occupant: Number(form.price_per_occupant) || 0,
      price_per_suitcase: Number(form.price_per_suitcase) || 0,
      features: form.features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
      distance_tiers: rowsToTiers(tierRows),
    }

    try {
      if (editingId === 'new') {
        await vehiclesApi.create(payload)
      } else {
        await vehiclesApi.update(editingId, payload)
      }
      closeForm()
      load()
    } catch (err) {
      setError(err.message || 'Failed to save vehicle')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(v) {
    try {
      await vehiclesApi.update(v.id, { active: !v.active })
      load()
    } catch (err) {
      setError(err.message || 'Failed to update vehicle')
    }
  }

  return (
    <div>
      <PageMeta title="Manage Vehicles" description="Fleet & pricing management — BlackStone Chauffeur admin." />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl text-brand-black">Vehicles</h1>
          <Button onClick={openCreate} className="!px-4 !py-2 text-sm">
            <Plus size={16} className="mr-1" /> Add Vehicle
          </Button>
        </div>
        <p className="mt-2 text-sm text-brand-black/50">
          These are the same vehicles and pricing shown on the Booking page's Select Vehicle step.
        </p>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && editingId === null && <p className="mt-8 text-red-500">{error}</p>}

        {!loading && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-black/10 text-left text-brand-black/50">
                  <th className="py-2 pr-4">Vehicle</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Passengers</th>
                  <th className="py-2 pr-4">Suitcases</th>
                  <th className="py-2 pr-4">Starting Price</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v.id} className="border-b border-brand-black/5">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        {v.image_url && (
                          <img src={v.image_url} alt={v.name} className="h-10 w-14 object-cover" />
                        )}
                        <span>{v.name}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4 capitalize">{v.type}</td>
                    <td className="py-2 pr-4">{v.passengers}</td>
                    <td className="py-2 pr-4">{v.suitcases}</td>
                    <td className="py-2 pr-4">{formatCurrency(v.starting_price || 0)}</td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => toggleActive(v)}
                        className={`text-xs ${v.active ? 'text-green-600' : 'text-brand-black/40'}`}
                      >
                        {v.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => openEdit(v)}
                        className="border border-brand-gold px-3 py-1 text-xs text-brand-gold hover:bg-brand-gold hover:text-brand-black"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <p className="py-8 text-brand-black/50">No vehicles yet.</p>}
          </div>
        )}

        {editingId !== null && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10">
            <div className="w-full max-w-2xl bg-white p-6 md:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl text-brand-black">
                  {editingId === 'new' ? 'Add Vehicle' : 'Edit Vehicle'}
                </h2>
                <button onClick={closeForm} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    required
                    placeholder="Name"
                    value={form.name}
                    onChange={update('name')}
                    className="border border-brand-black/15 px-3 py-2"
                  />
                  <select
                    value={form.type}
                    onChange={update('type')}
                    className="border border-brand-black/15 px-3 py-2"
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={update('description')}
                  className="border border-brand-black/15 px-3 py-2"
                  rows={2}
                />

                <input
                  placeholder="Image URL"
                  value={form.image_url}
                  onChange={update('image_url')}
                  className="border border-brand-black/15 px-3 py-2"
                />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <label className="text-xs text-brand-black/50">
                    Passengers
                    <input
                      type="number"
                      min="0"
                      value={form.passengers}
                      onChange={update('passengers')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs text-brand-black/50">
                    Suitcases
                    <input
                      type="number"
                      min="0"
                      value={form.suitcases}
                      onChange={update('suitcases')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs text-brand-black/50">
                    Capacity
                    <input
                      type="number"
                      min="0"
                      value={form.capacity}
                      onChange={update('capacity')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs text-brand-black/50">
                    Owned (fleet count)
                    <input
                      type="number"
                      min="0"
                      value={form.owned}
                      onChange={update('owned')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <label className="text-xs text-brand-black/50">
                    Starting price
                    <input
                      type="number"
                      step="0.01"
                      value={form.starting_price}
                      onChange={update('starting_price')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs text-brand-black/50">
                    Price / minute
                    <input
                      type="number"
                      step="0.01"
                      value={form.price_per_minute}
                      onChange={update('price_per_minute')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs text-brand-black/50">
                    Price / occupant
                    <input
                      type="number"
                      step="0.01"
                      value={form.price_per_occupant}
                      onChange={update('price_per_occupant')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs text-brand-black/50">
                    Price / suitcase
                    <input
                      type="number"
                      step="0.01"
                      value={form.price_per_suitcase}
                      onChange={update('price_per_suitcase')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2"
                    />
                  </label>
                </div>

                <input
                  placeholder="Features (comma separated) — e.g. Free Wifi, Meet & Greet"
                  value={form.features}
                  onChange={update('features')}
                  className="border border-brand-black/15 px-3 py-2"
                />

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-brand-black">
                      Distance pricing tiers (flat fare per bracket)
                    </p>
                    <button type="button" onClick={addTierRow} className="text-xs text-brand-gold">
                      + Add tier
                    </button>
                  </div>
                  <div className="mt-2 flex flex-col gap-2">
                    {tierRows.map((row, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min km"
                          value={row.min}
                          onChange={updateTierRow(i, 'min')}
                          className="w-24 border border-brand-black/15 px-2 py-1 text-sm"
                        />
                        <span className="text-brand-black/30">–</span>
                        <input
                          type="number"
                          placeholder="Max km (blank = open)"
                          value={row.max}
                          onChange={updateTierRow(i, 'max')}
                          className="w-36 border border-brand-black/15 px-2 py-1 text-sm"
                        />
                        <span className="text-brand-black/30">=</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={row.price}
                          onChange={updateTierRow(i, 'price')}
                          className="w-28 border border-brand-black/15 px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeTierRow(i)}
                          className="text-brand-black/40 hover:text-red-500"
                          aria-label="Remove tier"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-brand-black">
                  <input type="checkbox" checked={form.active} onChange={update('active')} />
                  Active (visible in Select Vehicle on the Booking page)
                </label>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="mt-2 flex gap-3">
                  <Button type="submit" disabled={saving} className="!px-6 !py-2 text-sm">
                    {saving ? 'Saving…' : 'Save Vehicle'}
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
