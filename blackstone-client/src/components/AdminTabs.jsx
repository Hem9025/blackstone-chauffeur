import { NavLink } from 'react-router-dom'
import { useAdminPermissions } from '../hooks/useAdminPermissions'

// Shared tab bar shown atop every /admin page. Which tabs a second_admin
// sees is controlled by the main admin from Admin > Settings (see
// useAdminPermissions) — 'admin' always sees everything. Settings itself is
// admin-only; second_admin can never change what they themselves can see.
export default function AdminTabs() {
  const { permissions, isAdmin } = useAdminPermissions()

  const tabs = [
    { to: '/admin', label: 'Bookings', show: permissions.can_manage_bookings },
    { to: '/admin/users', label: 'Users', show: permissions.can_manage_users },
    { to: '/admin/vehicles', label: 'Vehicles', show: permissions.can_manage_vehicles },
    { to: '/admin/stats', label: 'Drivers & Providers', show: permissions.can_view_stats },
    { to: '/admin/settings', label: 'Settings', show: isAdmin },
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
