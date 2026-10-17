import { useEffect, useState } from 'react'
import Button from './Button'
import { banner as bannerApi } from '../utils/api'

const BLANK_BANNER = { message: '', link_url: '', link_label: '', active: false }

function bannerToForm(b) {
  return {
    message: b.message || '',
    link_url: b.link_url || '',
    link_label: b.link_label || '',
    active: Boolean(b.active),
  }
}

// The homepage promo strip's editor — lives on the Coupons admin page
// (it's the same "marketing" area, and the same can_manage_bookings
// permission guards both). Self-contained: loads and saves the banner itself,
// so the page that renders it doesn't need to know anything about it.
export default function AdminPromoBannerSection() {
  const [form, setForm] = useState(BLANK_BANNER)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    bannerApi
      .get()
      .then((b) => setForm(bannerToForm(b)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: value }))
      setSaved(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const updated = await bannerApi.update({
        message: form.message.trim(),
        link_url: form.link_url.trim() || null,
        link_label: form.link_label.trim() || null,
        active: form.active,
      })
      setForm(bannerToForm(updated))
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-14 max-w-2xl border-t border-brand-black/10 pt-10">
      <h2 className="font-heading text-xl text-brand-black">Promo Banner</h2>
      <p className="mt-1 text-sm text-brand-black/50">
        A dismissible strip shown at the top of the homepage — for announcing a sale, seasonal
        offer, or a coupon code from the list above. Leave it off when there's nothing to say.
      </p>

      {loading ? (
        <p className="mt-4 text-brand-black/50">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4 border border-black/10 bg-white p-5">
          <label className="text-xs text-brand-black/50">
            Message
            <input
              required={form.active}
              maxLength={255}
              placeholder="e.g. 10% off wedding bookings this month — use code WELCOME10"
              value={form.message}
              onChange={update('message')}
              className="mt-1 w-full border border-brand-black/15 px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-xs text-brand-black/50">
              Link URL (optional)
              <input
                placeholder="/booking or https://…"
                value={form.link_url}
                onChange={update('link_url')}
                className="mt-1 w-full border border-brand-black/15 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-brand-black/50">
              Link text (optional)
              <input
                placeholder="Book now"
                value={form.link_label}
                onChange={update('link_label')}
                className="mt-1 w-full border border-brand-black/15 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-brand-black">
            <input type="checkbox" checked={form.active} onChange={update('active')} />
            Show this banner on the homepage
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving} className="!px-6 !py-2 text-sm">
              {saving ? 'Saving…' : 'Save Banner'}
            </Button>
            {saved && <span className="text-sm text-green-600">Saved</span>}
          </div>
        </form>
      )}
    </section>
  )
}
