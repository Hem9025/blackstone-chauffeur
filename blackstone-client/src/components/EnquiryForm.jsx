import { useState } from 'react'
import { enquiries } from '../utils/api'
import Button from './Button'

const initialState = { name: '', email: '', phone: '', message: '', type: 'general' }

export default function EnquiryForm({ type = 'general', dark = false }) {
  const [form, setForm] = useState({ ...initialState, type })
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [error, setError] = useState('')

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setError('')
    try {
      await enquiries.submit(form)
      setStatus('success')
      setForm({ ...initialState, type })
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  const inputClasses = dark
    ? 'w-full border border-brand-white/20 bg-transparent px-4 py-3 text-brand-white placeholder:text-brand-white/40 focus:border-brand-gold focus:outline-none'
    : 'w-full border border-brand-black/15 px-4 py-3 text-brand-black placeholder:text-brand-black/40 focus:border-brand-gold focus:outline-none'

  if (status === 'success') {
    return (
      <p className={dark ? 'text-brand-champagne' : 'text-brand-black'}>
        Thanks — we've received your enquiry and will be in touch shortly.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        required
        placeholder="Full name"
        value={form.name}
        onChange={update('name')}
        className={inputClasses}
      />
      <input
        required
        type="email"
        placeholder="Email address"
        value={form.email}
        onChange={update('email')}
        className={inputClasses}
      />
      <input
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={update('phone')}
        className={inputClasses}
      />
      <textarea
        required
        placeholder="How can we help?"
        rows={4}
        value={form.message}
        onChange={update('message')}
        className={inputClasses}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send Enquiry'}
      </Button>
    </form>
  )
}
