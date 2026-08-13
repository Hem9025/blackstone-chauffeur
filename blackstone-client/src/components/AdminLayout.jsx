import { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Users, Car, BarChart3, ShieldCheck, Globe, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminPermissions } from '../hooks/useAdminPermissions'

// Every admin-area page (Dashboard, Bookings, Users, Vehicles, Drivers &
// Providers, Second Admin Management) renders inside this shell via
// <Outlet/>. Centralising the nav here means there's exactly one place to
// add a section, and every page automatically gets: a persistent way back
// to any other section (no dead ends), a same-page highlight of where you
// are, and one predictable content container instead of several slightly
// different copies of the same markup. Which of these a second_admin
// actually sees is controlled by the main admin from Second Admin
// Management (see useAdminPermissions) — 'admin' always sees everything,
// and that page itself is always admin-only.
const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, flag: 'can_view_stats' },
  { to: '/admin', label: 'Bookings', icon: ClipboardList, end: true, flag: 'can_manage_bookings' },
  { to: '/admin/users', label: 'Users', icon: Users, flag: 'can_manage_users' },
  { to: '/admin/vehicles', label: 'Vehicles', icon: Car, flag: 'can_manage_vehicles' },
  { to: '/admin/stats', label: 'Drivers & Providers', icon: BarChart3, flag: 'can_view_stats' },
  { to: '/admin/settings', label: 'Second Admin Management', icon: ShieldCheck, adminOnly: true },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { permissions, isAdmin } = useAdminPermissions()

  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin
    return isAdmin || permissions[item.flag]
  })
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
          long scrolling table. Offset by the navbar's real rendered height
          at the lg breakpoint (logo lg:h-20 = 80px + py-2.5 = 20px = 100px)
          — top-16/4rem undershot this, which pinned the sidebar a bit too
          high and pushed its bottom (Logout etc.) past the viewport with no
          way to scroll to it. overflow-y-auto lets it scroll internally
          whenever the nav list is taller than the space below the navbar. */}
      <aside className="sticky top-[100px] hidden h-[calc(100vh-100px)] w-60 shrink-0 flex-col overflow-y-auto bg-brand-black lg:flex">
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
            <aside className="relative flex h-full w-64 flex-col overflow-y-auto bg-brand-black">
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
