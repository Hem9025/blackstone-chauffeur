import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/fleet/luxury', label: 'Luxury Fleet' },
  { to: '/fleet/economy', label: 'Premium Economy' },
  { to: '/tour', label: 'Tour' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
]

const dashboardPath = {
  admin: '/admin',
  second_admin: '/admin',
  driver: '/driver',
  provider: '/provider',
  customer: '/dashboard',
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <header className="bg-brand-black text-brand-white sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="font-heading text-xl tracking-wide text-brand-gold">
          BlackStone Chauffeur
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm tracking-wide transition-colors hover:text-brand-gold ${
                  isActive ? 'text-brand-gold' : 'text-brand-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <Link
                to={dashboardPath[user.role] || '/dashboard'}
                className="text-sm text-brand-gold"
              >
                Dashboard
              </Link>
              <button onClick={logout} className="text-sm text-brand-white/80 hover:text-brand-gold">
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="border border-brand-gold px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-colors"
            >
              Login
            </Link>
          )}
        </nav>

        <button
          className="text-brand-white md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-4 border-t border-brand-black-soft px-4 py-4 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="text-sm text-brand-white hover:text-brand-gold"
            >
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <Link to={dashboardPath[user.role] || '/dashboard'} onClick={() => setOpen(false)} className="text-sm text-brand-gold">
                Dashboard
              </Link>
              <button onClick={logout} className="text-left text-sm text-brand-white/80">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="text-sm text-brand-gold">
              Login
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
