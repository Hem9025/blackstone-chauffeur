import { Link } from 'react-router-dom'
import { ChevronRight, LogOut, User, Globe } from 'lucide-react'
import { NAV_ITEMS } from '../components/AdminLayout'
import { useAdminPermissions } from '../hooks/useAdminPermissions'
import { useAuth } from '../context/AuthContext'

// Phone-app "More" menu for admins: every admin section the person is allowed
// to use, as a clean list (replaces the website's dark sidebar/drawer).
export default function AppAdminMore() {
  const { user, logout } = useAuth()
  const { permissions, isAdmin } = useAdminPermissions()

  const items = NAV_ITEMS.filter((item) => {
    if (['/admin', '/admin/dashboard'].includes(item.to)) return false // already tabs
    if (item.adminOnly) return isAdmin
    return isAdmin || permissions[item.flag]
  })

  const row = 'flex items-center gap-3 px-4 py-3.5 text-[15px] text-brand-black active:bg-black/5'

  return (
    <div className="mx-auto max-w-md">
      <p className="px-1 pb-3 text-sm text-black/50">
        {user?.name} · {user?.role === 'second_admin' ? 'Second admin' : 'Admin'}
      </p>

      <div className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className={row}>
            <item.icon size={20} className="text-brand-gold" />
            <span className="flex-1">{item.label === 'Second Admin Management' ? 'Second admins' : item.label}</span>
            <ChevronRight size={18} className="text-black/25" />
          </Link>
        ))}
      </div>

      <div className="mt-5 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm">
        <Link to="/profile" className={row}>
          <User size={20} className="text-brand-gold" />
          <span className="flex-1">My account</span>
          <ChevronRight size={18} className="text-black/25" />
        </Link>
        <a href="https://www.blackstonechauffeur.co.nz" target="_blank" rel="noreferrer" className={row}>
          <Globe size={20} className="text-brand-gold" />
          <span className="flex-1">View website</span>
          <ChevronRight size={18} className="text-black/25" />
        </a>
        <button type="button" onClick={logout} className={`${row} w-full text-left text-red-600`}>
          <LogOut size={20} />
          <span className="flex-1">Log out</span>
        </button>
      </div>
    </div>
  )
}
