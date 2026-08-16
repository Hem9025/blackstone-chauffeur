import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from './Button'
import NotificationBell from './NotificationBell'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
]

const fleetLinks = [
  { to: '/fleet/luxury', label: 'Luxury Fleet' },
  { to: '/fleet/comfort', label: 'Comfort Fleet' },
]

const trailingLinks = [
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

// Pages that open with a full-bleed dark/image hero — the nav can float
// transparent on top of these. Everywhere else it stays solid so it never
// overlaps unreadable content.
const TRANSPARENT_ROUTES = ['/', '/about', '/services', '/fleet/luxury', '/fleet/comfort', '/tour', '/contact']

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  // Hero pages keep a faint black tint the whole time you're on them —
  // including after scrolling — rather than a fully see-through header or a
  // solid one. It only turns fully solid while the mobile menu is open,
  // since its dropdown needs a readable background regardless of page.
  const isHeroRoute = (TRANSPARENT_ROUTES.includes(pathname) || pathname.startsWith('/tour/')) && !open
  const isTinted = isHeroRoute

  return (
    <header
      // `fixed` (not `sticky`) on hero pages: it needs to sit outside normal
      // document flow so the full-bleed hero image starts at the very top
      // behind it, but `fixed` — unlike the `absolute` this replaced —
      // stays pinned to the viewport as the page scrolls instead of
      // scrolling away with it. Non-hero pages keep `sticky`, which already
      // reserves its own space in the flow right below the header.
      className={`top-0 left-0 right-0 z-50 w-full text-brand-white transition-colors ${
        isHeroRoute ? 'fixed' : 'sticky'
      } ${isTinted ? 'bg-black/20' : 'bg-brand-black'}`}
    >
      {/* Single nav row — no separate utility bar, kept short. No max-w
          cap: on wide screens a centered max-w-7xl box leaves hundreds of
          px of empty space on both sides, which is what kept showing up
          as a big gap after Book Now. Full width + fixed padding keeps
          that gap to just the padding value, on every screen size. */}
      <div className="flex items-center justify-between px-4 py-2.5 md:px-8 lg:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          {/* Smaller on phones — h-16 for everything under md was oversized
              on narrow screens (confirmed on an actual device screenshot).
              Desktop (md/lg) sizing is unchanged. */}
          <img src="/images/brand/logo.png" alt="BlackStone Chauffeur" className="h-12 w-auto md:h-16 lg:h-20" />
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm tracking-wide transition-colors hover:text-brand-gold ${
                  isActive ? 'text-brand-gold' : 'text-brand-white/90'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {/* Fleet — hover dropdown with the two standalone fleet pages */}
          <div className="group relative">
            <button
              className={`flex items-center gap-1 text-sm tracking-wide transition-colors hover:text-brand-gold ${
                pathname.startsWith('/fleet') ? 'text-brand-gold' : 'text-brand-white/90'
              }`}
            >
              Fleet <ChevronDown size={14} />
            </button>
            <div className="invisible absolute left-0 top-full pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <div className="w-44 border border-white/10 bg-brand-black py-2 shadow-xl">
                {fleetLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block px-4 py-2 text-sm text-brand-white/90 hover:bg-white/5 hover:text-brand-gold"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {trailingLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm tracking-wide transition-colors hover:text-brand-gold ${
                  isActive ? 'text-brand-gold' : 'text-brand-white/90'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {/* Account links — folded into the single row instead of a
              separate utility bar above it */}
          <div className="flex items-center gap-3 border-l border-white/15 pl-5 text-xs text-brand-white/70">
            {user ? (
              <>
                <Link to={dashboardPath[user.role] || '/dashboard'} className="hover:text-brand-gold">
                  Dashboard
                </Link>
                <Link to="/profile" className="hover:text-brand-gold">
                  Profile
                </Link>
                <button onClick={logout} className="hover:text-brand-gold">Logout</button>
                <NotificationBell dark />
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-brand-gold">Login</Link>
                <Link to="/register" className="hover:text-brand-gold">Sign Up</Link>
              </>
            )}
          </div>

          <Button to="/booking" className="!px-5 !py-2 text-sm">
            Book Now
          </Button>
        </nav>

        {/* shrink-0 guarantees this never gets squeezed out of view by the
            logo on a narrow screen, no matter how wide the logo renders.
            lg:hidden is on THIS wrapper, not just its children — with only
            the children hidden, this div was still a real (if invisible)
            flex item under justify-between, which still reserved a gap in
            front of it, silently pushing Book Now away from the true right
            edge at desktop widths. Hiding the wrapper itself removes it
            from the flex layout entirely at lg, so justify-between only
            ever sees logo + nav there. */}
        <div className="flex shrink-0 items-center gap-4 lg:hidden">
          {user && <NotificationBell dark />}
          <button
            className="text-brand-white"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-4 border-t border-brand-black-soft bg-brand-black px-4 py-4 lg:hidden">
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

          <div className="flex flex-col gap-3 border-l border-white/10 pl-3">
            <p className="text-xs uppercase tracking-widest text-brand-white/40">Fleet</p>
            {fleetLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="text-sm text-brand-white hover:text-brand-gold"
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {trailingLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="text-sm text-brand-white hover:text-brand-gold"
            >
              {link.label}
            </NavLink>
          ))}

          <Button to="/booking" className="self-start" onClick={() => setOpen(false)}>
            Book Now
          </Button>
          {user ? (
            <>
              <Link to={dashboardPath[user.role] || '/dashboard'} onClick={() => setOpen(false)} className="text-sm text-brand-gold">
                Dashboard
              </Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="text-sm text-brand-white/80">
                Profile
              </Link>
              <button onClick={logout} className="text-left text-sm text-brand-white/80">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm text-brand-gold">
                Login
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="text-sm text-brand-white/80">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
