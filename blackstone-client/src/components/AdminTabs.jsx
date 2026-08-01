import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Shared tab bar shown atop every /admin page. Bookings is available to
// both admin and second_admin; Users and Vehicles management are
// admin-only, matching the role guards on those routes in App.jsx.
export default function AdminTabs() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const tabs = [
    { to: '/admin', label: 'Bookings', show: true },
    { to: '/admin/users', label: 'Users', show: isAdmin },
    { to: '/admin/vehicles', label: 'Vehicles', show: isAdmin },
    { to: '/admin/stats', label: 'Drivers & Providers', show: isAdmin },
  ]

  return (
    <div className="border-b border-brand-black/10">
      <nav className="mx-auto flex max-w-6xl gap-6 px-4 md:px-8">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/admin'}
              className={({ isActive }) =>
                `border-b-2 py-4 text-sm tracking-wide transition-colors ${
                  isActive
                    ? 'border-brand-gold text-brand-black'
                    : 'border-transparent text-brand-black/50 hover:text-brand-black'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
      </nav>
    </div>
  )
}
