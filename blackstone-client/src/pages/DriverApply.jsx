import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export default function DriverApply() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: '',
    licenseNumber: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      // vehicleType / licenseNumber are captured here for the application but the
      // current /register endpoint only persists core user fields — extend the
      // users/drivers schema in Phase 3 if these need to be stored server-side.
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: 'driver',
      })
      navigate('/pending')
    } catch (err) {
      setError(err.message || 'Application failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageMeta title="Driver Application" description="Apply to drive for BlackStone Chauffeur." />

      <section className="mx-auto max-w-md px-4 py-20 md:px-8">
        <h1 className="font-heading text-3xl text-brand-black">Apply as a Driver</h1>
        <p className="mt-2 text-sm text-brand-black/60">
          Applications are reviewed by our team — you'll receive an email once approved.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={update('name')}
            className="border border-brand-black/15 px-4 py-3"
          />
          <input
            required
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={update('email')}
            className="border border-brand-black/15 px-4 py-3"
          />
          <input
            required
            placeholder="Phone"
            value={form.phone}
            onChange={update('phone')}
            className="border border-brand-black/15 px-4 py-3"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={update('password')}
            className="border border-brand-black/15 px-4 py-3"
          />
          <input
            required
            placeholder="Vehicle type"
            value={form.vehicleType}
            onChange={update('vehicleType')}
            className="border border-brand-black/15 px-4 py-3"
          />
          <input
            required
            placeholder="Driver's license number"
            value={form.licenseNumber}
            onChange={update('licenseNumber')}
            className="border border-brand-black/15 px-4 py-3"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Application'}
          </Button>
        </form>
      </section>
    </div>
  )
}
