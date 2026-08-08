import { useState } from 'react'
import { MapPin, Calendar, Mail, ArrowRight, CheckCircle } from 'lucide-react'
import { minBookingDate } from '../utils/bookingRules'
import { enquiries } from '../utils/api'

// Sits directly under the hero. Despite the trip-detail fields (kept so a
// visitor can jot down their journey), this is a quick-contact form, not a
// booking form — submitting emails the admin inbox directly via the same
// enquiries pipeline the Contact page uses, and confirms to the visitor
// that they'll hear back within 24 hours rather than sending them into the
// multi-step booking flow.
export default function QuickBookWidget() {
  const [form, setForm] = useState({ pickup: '', dropoff: '', date: '', email: '' })
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [error, setError] = useState('')

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setError('')

    const messageLines = []
    if (form.pickup) messageLines.push(`Pickup: ${form.pickup}`)
    if (form.dropoff) messageLines.push(`Drop-off: ${form.dropoff}`)
    if (form.date) messageLines.push(`Date: ${form.date}`)

    try {
      await enquiries.submit({
        email: form.email,
        message: messageLines.length ? messageLines.join('\n') : 'Quick enquiry from the homepage.',
        type: 'quick-contact',
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Something went wrong — please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex w-full flex-col items-center gap-2 bg-white px-8 py-8 text-center text-brand-black shadow-xl">
        <CheckCircle size={28} className="text-brand-gold" />
        <p className="font-heading text-lg">Message sent!</p>
        <p className="max-w-sm text-sm text-brand-black/60">
          We've received your details and will get back to you within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col divide-y divide-black/10 bg-white text-brand-black shadow-xl md:flex-row md:divide-x md:divide-y-0"
      >
        <Field icon={MapPin} placeholder="Pickup location" value={form.pickup} onChange={update('pickup')} />
        <Field icon={MapPin} placeholder="Drop-off location" value={form.dropoff} onChange={update('dropoff')} />
        <Field icon={Calendar} type="date" min={minBookingDate()} value={form.date} onChange={update('date')} />
        <Field icon={Mail} type="email" required placeholder="Email address" value={form.email} onChange={update('email')} />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex items-center justify-center gap-2 bg-brand-gold px-8 py-4 font-medium tracking-wide text-brand-black transition-colors hover:bg-brand-champagne disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' ? 'Sending…' : 'Get in Touch'} <ArrowRight size={16} />
        </button>
      </form>
      {error && <p className="mt-2 bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Field({ icon: Icon, ...props }) {
  return (
    <div className="flex flex-1 items-center gap-2 px-5 py-4">
      <Icon size={16} className="shrink-0 text-brand-black/40" />
      <input
        {...props}
        className="w-full bg-transparent text-sm text-brand-black placeholder:text-brand-black/40 focus:outline-none"
      />
    </div>
  )
}
