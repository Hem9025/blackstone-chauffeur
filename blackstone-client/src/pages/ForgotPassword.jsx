import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import { auth as authApi } from '../utils/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await authApi.forgotPassword(email)
      // Always shows the same success state regardless of whether the email
      // was actually registered — the server responds with an identical
      // generic message either way, so there's nothing more specific to show.
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageMeta title="Forgot Password" description="Reset your BlackStone Chauffeur account password." />

      <section className="mx-auto max-w-md px-4 py-20 md:px-8">
        <h1 className="font-heading text-3xl text-brand-black">Forgot Password</h1>

        {sent ? (
          <>
            <p className="mt-6 text-sm text-brand-black/70">
              If that email is registered, we've sent a link to reset your password. Check your inbox
              (and spam folder) — the link expires in 1 hour.
            </p>
            <p className="mt-6 text-sm text-brand-black/60">
              <Link to="/login" className="text-brand-gold">Back to Login</Link>
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-brand-black/60">
              Enter the email on your account and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <input
                required
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-brand-black/15 px-4 py-3"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </form>

            <p className="mt-6 text-sm text-brand-black/60">
              <Link to="/login" className="text-brand-gold">Back to Login</Link>
            </p>
          </>
        )}
      </section>
    </div>
  )
}
