import { Link, Navigate } from 'react-router-dom'
import { CalendarPlus, Phone, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const dashboardPath = {
  admin: '/admin',
  second_admin: '/admin',
  driver: '/driver',
  provider: '/provider',
  customer: '/dashboard',
}

// What the phone app shows at "/": signed-in users go straight to their own
// home; everyone else sees a simple welcome with the three things they came for.
export default function AppWelcome() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to={dashboardPath[user.role] || '/dashboard'} replace />

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 pb-8 pt-10 text-center">
      <img src="/images/brand/logo.png" alt="BlackStone Chauffeur" className="h-24 w-24" />
      <h1 className="mt-5 font-heading text-3xl text-brand-black">BlackStone Chauffeur</h1>
      <p className="mt-2 text-sm text-black/55">Premium chauffeur service across New Zealand.</p>

      <div className="mt-8 flex w-full flex-col gap-3">
        <Link
          to="/booking"
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand-gold py-4 text-base font-semibold text-brand-black active:opacity-80"
        >
          <CalendarPlus size={20} /> Book a ride
        </Link>
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white py-4 text-base font-medium text-brand-black active:bg-black/5"
        >
          <LogIn size={20} /> Sign in
        </Link>
        <a
          href="tel:+64204525000"
          className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white py-4 text-base font-medium text-brand-black active:bg-black/5"
        >
          <Phone size={20} /> Call us
        </a>
      </div>
    </div>
  )
}
