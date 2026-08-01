import { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Car, BarChart3, Globe, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Every admin-area page (Bookings, Users, Vehicles, Drivers & Providers)
// renders inside this shell via <Outlet/>. Centralising the nav here means
// there's exactly one place to add a section, and every page automatically
// gets: a persistent way back to any other section (no dead ends), a
// same-page highlight of where you are, and one predictable content
// container instead of four slightly different copies of the same markup.
const NAV_ITEMS = [
  { to: '/admin', label: 'Bookings', icon: LayoutDashboard, end: true, adminOnly: false },
  { to: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/admin/vehicles', label: 'Vehicles', icon: Car, adminOnly: true },
  { to: '/admin/stats', label: 'Drivers & Providers', icon: BarChart3, adminOnly: true },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isAdmin = user?.role === 'admin'
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)
  const current = items.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))

  // Close the mobile drawer on navigation so it never stays open behind a
  // fresh page.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  function NavList({ onNavigate }) {
    return (
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'border-brand-gold bg-white/5 text-brand-white'
                  : 'border-transparent text-brand-white/60 hover:border-white/20 hover:bg-white/5 hover:text-brand-white'
              }`
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    )
  }

  function SidebarFooter({ onNavigate }) {
    return (
      <div className="border-t border-white/10 px-3 py-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 text-sm text-brand-white/60 hover:text-brand-gold"
        >
          <Globe size={16} /> View Site
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-brand-white/60 hover:text-brand-gold"
        >
          <LogOut size={16} /> Logout
        </button>
        <p className="mt-2 truncate px-3 text-xs text-brand-white/30">
          {user?.name} · {user?.role === 'second_admin' ? 'Second Admin' : 'Admin'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-stretch bg-[#f7f6f3]">
      {/* Desktop sidebar — sticky so it's always reachable, even against a
          long scrolling table. Offset by the navbar's height (top-16) so it
          doesn't slide underneath it. */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col overflow-y-auto bg-brand-black lg:flex">
        <div className="px-5 py-6">
          <p className="text-xs uppercase tracking-widest text-brand-white/40">BlackStone</p>
          <p className="font-heading text-lg text-brand-white">Admin Panel</p>
        </div>
        <NavList />
        <SidebarFooter />
      </aside>

      {/* Mobile top bar + slide-over drawer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open admin menu" className="text-brand-black">
            <Menu size={22} />
          </button>
          <p className="font-heading text-base text-brand-black">{current?.label || 'Admin Panel'}</p>
          <span className="w-[22px]" />
        </div>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <aside className="relative flex h-full w-64 flex-col bg-brand-black">
              <div className="flex items-center justify-between px-5 py-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-brand-white/40">BlackStone</p>
                  <p className="font-heading text-lg text-brand-white">Admin Panel</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} aria-label="Close admin menu" className="text-brand-white/60">
                  <X size={20} />
                </button>
              </div>
              <NavList onNavigate={() => setDrawerOpen(false)} />
              <SidebarFooter onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-8 md:px-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
