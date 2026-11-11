import { NavLink, useLocation } from 'react-router-dom'
import { Home, CalendarPlus, User, Briefcase, LayoutDashboard, ClipboardList, Menu, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Bottom tab bar — the phone-app navigation. Tabs depend on who is logged in.
const GUEST_TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/booking', label: 'Book', icon: CalendarPlus },
  { to: '/login', label: 'Sign in', icon: User },
]

const TABS = {
  customer: [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/booking', label: 'Book', icon: CalendarPlus },
    { to: '/profile', label: 'Account', icon: User },
  ],
  driver: [
    { to: '/driver', label: 'Jobs', icon: Briefcase },
    { to: '/profile', label: 'Account', icon: User },
  ],
  provider: [
    { to: '/provider', label: 'Bookings', icon: ClipboardList },
    { to: '/profile', label: 'Account', icon: User },
  ],
  admin: [
    { to: '/admin', label: 'Bookings', icon: ClipboardList, end: true, notQuery: 'view=new' },
    { to: '/admin?view=new', label: 'New', icon: PlusCircle, query: 'view=new' },
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/more', label: 'More', icon: Menu },
  ],
}
TABS.second_admin = TABS.admin

export default function AppTabBar() {
  const { user } = useAuth()
  const { search } = useLocation()
  const tabs = user ? TABS[user.role] || TABS.customer : GUEST_TABS

  return (
    <nav className="app-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur">
      <ul className="flex">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => {
                // The "New" tab shares /admin with Bookings and is told apart by ?view=new
                const active =
                  tab.query ? isActive && search.includes(tab.query) : tab.notQuery ? isActive && !search.includes(tab.notQuery) : isActive
                return `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  active ? 'text-brand-gold' : 'text-black/45'
                }`
              }}
            >
              <tab.icon size={22} strokeWidth={1.8} />
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
