import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import { SOCIAL_LINKS } from '../constants/seo'

// lucide-react dropped brand/logo icons (trademark reasons) — simple inline
// marks are used here instead so the footer doesn't depend on a brand icon set.
function FacebookMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
    </svg>
  )
}
function InstagramMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

// No X/Twitter icon — that account doesn't exist yet. Add it back here
// (and to SOCIAL_LINKS in constants/seo.js) once one is created.
const social = [
  { icon: FacebookMark, href: SOCIAL_LINKS.facebook, label: 'Facebook' },
  { icon: InstagramMark, href: SOCIAL_LINKS.instagram, label: 'Instagram' },
]

// Mirrors the city list on the About page's "Where We Operate" section —
// update both together if the operating area changes.
const CITIES_WE_SERVE = [
  'Auckland', 'Hamilton', 'Rotorua', 'Christchurch', 'Wellington', 'Napier', 'Taupō', 'Queenstown',
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-brand-black text-brand-white/70">
      {/* Decorative brand mark — the same abstract shape used everywhere
          else, recoloured to a flat gold via CSS mask (rather than the
          multi-colour source SVG) and kept very low-opacity so it reads as
          texture, not a competing graphic. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -bottom-20 h-[28rem] w-[28rem] opacity-[0.05]"
        style={{
          backgroundColor: 'var(--color-brand-gold)',
          WebkitMaskImage: 'url(/favicon.svg)',
          maskImage: 'url(/favicon.svg)',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <img src="/images/brand/logo.png" alt="BlackStone Chauffeur" className="h-20 w-auto" />
            <p className="mt-3 text-sm">Premium chauffeur service, driven by excellence.</p>
            <div className="mt-5 flex gap-3">
              {social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 hover:border-brand-gold hover:text-brand-gold"
                >
                  <s.icon width={14} height={14} />
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <p className="mb-1 text-xs uppercase tracking-widest text-brand-white/40">Company</p>
            <Link to="/about" className="hover:text-brand-gold">About Us</Link>
            <Link to="/services" className="hover:text-brand-gold">Services</Link>
            <Link to="/fleet/luxury" className="hover:text-brand-gold">Luxury Fleet</Link>
            <Link to="/fleet/comfort" className="hover:text-brand-gold">Comfort Fleet</Link>
            <Link to="/gallery" className="hover:text-brand-gold">Gallery</Link>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <p className="mb-1 text-xs uppercase tracking-widest text-brand-white/40">Get Started</p>
            <Link to="/booking" className="hover:text-brand-gold">Book a Ride</Link>
            <Link to="/apply" className="hover:text-brand-gold">Drive With Us</Link>
            <Link to="/contact" className="hover:text-brand-gold">Contact</Link>
            <Link to="/terms" className="hover:text-brand-gold">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="hover:text-brand-gold">Privacy Policy</Link>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <p className="mb-1 text-xs uppercase tracking-widest text-brand-white/40">Contact</p>
            <a href="tel:+64204525000" className="flex items-center gap-2 hover:text-brand-gold">
              <Phone size={14} /> +64 20 452 5000
            </a>
            <a href="mailto:info@blackstonechauffeur.co.nz" className="flex items-center gap-2 hover:text-brand-gold">
              <Mail size={14} /> info@blackstonechauffeur.co.nz
            </a>
            <p className="flex items-center gap-2">
              <MapPin size={14} /> New Zealand
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-white/10 pt-6 text-xs">
          <p className="text-xs uppercase tracking-widest text-brand-white/40">Cities We Serve:</p>
          {CITIES_WE_SERVE.map((city, i) => (
            <span key={city} className="text-brand-white/70">
              {city}{i < CITIES_WE_SERVE.length - 1 ? ' ·' : ''}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BlackStone Chauffeur. All rights reserved.</p>
          <p className="text-brand-white/40">Built with care for a five-star ride.</p>
        </div>
      </div>
    </footer>
  )
}
