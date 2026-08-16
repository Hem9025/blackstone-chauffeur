import { useState } from 'react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/AuthContext'
import { auth as authApi } from '../utils/api'

export default function Profile() {
  const { user, refresh } = useAuth()

  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [pwMessage, setPwMessage] = useState('')
  const [pwError, setPwError] = useState('')

  if (!user) return null

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError('')
    setProfileMessage('')
    try {
      await authApi.updateProfile(form)
      await refresh()
      setProfileMessage('Profile updated.')
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPwError('')
    setPwMessage('')

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match')
      return
    }

    setSavingPassword(true)
    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setPwMessage('Password changed.')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwError(err.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div>
      <PageMeta title="My Profile" description="Manage your BlackStone Chauffeur account." />

      <section className="mx-auto max-w-2xl px-4 py-16 md:px-8">
        <h1 className="font-heading text-3xl text-brand-black">My Profile</h1>
        <p className="mt-2 text-sm capitalize text-brand-black/50">{user.role.replace('_', ' ')} account</p>

        {/* Profile details */}
        <div className="mt-10 border border-brand-black/10 p-6">
          <h2 className="font-heading text-lg text-brand-black">Account Details</h2>
          <form onSubmit={handleProfileSubmit} className="mt-4 flex flex-col gap-4">
            <label className="text-xs text-brand-black/50">
              Full name
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full border border-brand-black/15 px-4 py-3"
              />
            </label>
            <label className="text-xs text-brand-black/50">
              Email (contact support to change)
              <input
                disabled
                value={user.email}
                className="mt-1 w-full border border-brand-black/10 bg-brand-black/5 px-4 py-3 text-brand-black/50"
              />
            </label>
            <label className="text-xs text-brand-black/50">
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full border border-brand-black/15 px-4 py-3"
              />
            </label>

            {profileError && <p className="text-sm text-red-500">{profileError}</p>}
            {profileMessage && <p className="text-sm text-green-600">{profileMessage}</p>}

            <Button type="submit" disabled={savingProfile} className="self-start !px-6 !py-2 text-sm">
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </div>

        {/* Password */}
        <div className="mt-8 border border-brand-black/10 p-6">
          <h2 className="font-heading text-lg text-brand-black">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="mt-4 flex flex-col gap-4">
            <PasswordInput
              required
              placeholder="Current password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              className="border border-brand-black/15 px-4 py-3"
            />
            <PasswordInput
              required
              placeholder="New password (min. 8 characters)"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              className="border border-brand-black/15 px-4 py-3"
            />
            <PasswordInput
              required
              placeholder="Confirm new password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="border border-brand-black/15 px-4 py-3"
            />

            {pwError && <p className="text-sm text-red-500">{pwError}</p>}
            {pwMessage && <p className="text-sm text-green-600">{pwMessage}</p>}

            <Button type="submit" disabled={savingPassword} className="self-start !px-6 !py-2 text-sm">
              {savingPassword ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
