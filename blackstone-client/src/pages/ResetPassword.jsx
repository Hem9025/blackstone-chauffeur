import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import PasswordInput from '../components/PasswordInput'
import { auth as authApi } from '../utils/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await authApi.resetPassword({ token, newPassword: form.newPassword })
      // No need for a dedicated "success" screen here — landing straight on
      // Login with a clear one-time message is the fastest path back in.
      navigate('/login', { state: { message: 'Password reset — you can now log in with your new password.' } })
    } catch (err) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageMeta title="Reset Password" description="Choose a new password for your BlackStone Chauffeur account." />

      <section className="mx-auto max-w-md px-4 py-20 md:px-8">
        <h1 className="font-heading text-3xl text-brand-black">Reset Password</h1>

        {!token ? (
          <p className="mt-6 text-sm text-red-500">
            This link is missing its reset token. Please use the link from your email, or{' '}
            <Link to="/forgot-password" className="text-brand-gold">request a new one</Link>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <PasswordInput
              required
              placeholder="New password (min. 8 characters)"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              className="border border-brand-black/15 px-4 py-3"
            />
            <PasswordInput
              required
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="border border-brand-black/15 px-4 py-3"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset Password'}
            </Button>
          </form>
        )}
      </section>
    </div>
  )
}
