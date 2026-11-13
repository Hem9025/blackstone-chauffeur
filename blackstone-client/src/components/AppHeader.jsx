import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

// Slim, light top bar used only inside the phone app (replaces the website
// Navbar). Rendered as a <header> on purpose — AdminLayout measures the first
// <header> on the page to position its sidebar.
const TITLES = {
  '/dashboard': 'My rides',
  '/booking': 'Book a ride',
  '/booking/success': 'Booking confirmed',
  '/driver': 'My jobs',
  '/provider': 'Bookings',
  '/profile': 'Account',
  '/admin': 'Bookings',
  '/admin/dashboard': 'Overview',
  '/admin/users': 'Users',
  '/admin/vehicles': 'Vehicles',
  '/admin/drivers': 'Drivers',
  '/admin/providers': 'Providers',
  '/admin/coupons': 'Coupons',
  '/admin/subscribers': 'Subscribers',
  '/admin/blog': 'Blog',
  '/admin/settings': 'Second admins',
  '/admin/more': 'More',
  '/admin/paste': 'Paste bookings',
  '/contact': 'Contact us',
  '/privacy': 'Privacy',
  '/terms': 'Terms',
}

const ROOTS = ['/', '/dashboard', '/driver', '/provider', '/admin', '/admin/dashboard', '/admin/more', '/profile', '/booking', '/login']

export default function AppHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const title = TITLES[pathname] || (pathname.startsWith('/admin/') ? 'Admin' : 'BlackStone')
  const showBack = !ROOTS.includes(pathname)

  return (
    <header className="app-header sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="flex h-12 items-center justify-between px-3">
        <div className="flex min-w-0 items-center gap-1">
          {showBack ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full text-brand-black active:bg-black/5"
            >
              <ChevronLeft size={24} />
            </button>
          ) : (
            <img src="/images/brand/logo.png" alt="" className="h-8 w-8" />
          )}
          <h1 className="truncate text-base font-semibold text-brand-black">{title}</h1>
        </div>
        {user && <NotificationBell />}
      </div>
    </header>
  )
}
