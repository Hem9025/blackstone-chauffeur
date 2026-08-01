import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

const dashboardPath = {
  admin: '/admin',
  second_admin: '/admin',
  driver: '/driver',
  provider: '/provider',
  customer: '/dashboard',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
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
      const user = await login(form)
      if (user.status === 'pending') {
        navigate('/pending')
      } else {
        navigate(dashboardPath[user.role] || '/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageMeta title="Login" description="Log in to your BlackStone Chauffeur account." />

      <section className="mx-auto max-w-md px-4 py-20 md:px-8">
        <h1 className="font-heading text-3xl text-brand-black">Login</h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={update('password')}
            className="border border-brand-black/15 px-4 py-3"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Login'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-brand-black/60">
          No account? <Link to="/register" className="text-brand-gold">Register</Link>{' '}
          · <Link to="/apply" className="text-brand-gold">Apply as a driver</Link>
        </p>
      </section>
    </div>
  )
}
