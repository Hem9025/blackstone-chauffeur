import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Mail, ArrowRight } from 'lucide-react'
import { minBookingDate } from '../utils/bookingRules'

export default function QuickBookWidget() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ pickup: '', dropoff: '', date: '', email: '' })

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams(form).toString()
    navigate(`/booking?${params}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col divide-y divide-black/10 bg-white text-brand-black shadow-xl md:flex-row md:divide-x md:divide-y-0"
    >
      <Field icon={MapPin} placeholder="Pickup location" value={form.pickup} onChange={update('pickup')} />
      <Field icon={MapPin} placeholder="Drop-off location" value={form.dropoff} onChange={update('dropoff')} />
      <Field icon={Calendar} type="date" min={minBookingDate()} value={form.date} onChange={update('date')} />
      <Field icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={update('email')} />
      <button
        type="submit"
        className="flex items-center justify-center gap-2 bg-brand-gold px-8 py-4 font-medium tracking-wide text-brand-black transition-colors hover:bg-brand-champagne"
      >
        Get in Touch <ArrowRight size={16} />
      </button>
    </form>
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
