import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
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
      await register({ ...form, role: 'customer' })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageMeta title="Register" description="Create a BlackStone Chauffeur account." />

      <section className="mx-auto max-w-md px-4 py-20 md:px-8">
        <h1 className="font-heading text-3xl text-brand-black">Create an Account</h1>

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
            placeholder="Phone"
            value={form.phone}
            onChange={update('phone')}
            className="border border-brand-black/15 px-4 py-3"
          />
          <PasswordInput
            required
            placeholder="Password"
            value={form.password}
            onChange={update('password')}
            className="border border-brand-black/15 px-4 py-3"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-brand-black/60">
          Already have an account? <Link to="/login" className="text-brand-gold">Login</Link>
        </p>
      </section>
    </div>
  )
}
