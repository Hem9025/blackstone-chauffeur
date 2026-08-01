import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'

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
function XMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 3H22l-7.6 8.7L23 21h-6.6l-5.2-6.6L5.2 21H2l8.1-9.3L2 3h6.7l4.7 6.1L18.9 3Zm-1.2 16.2h1.8L7.4 4.7H5.5l12.2 14.5Z" />
    </svg>
  )
}

const social = [
  { icon: FacebookMark, href: '#', label: 'Facebook' },
  { icon: InstagramMark, href: '#', label: 'Instagram' },
  { icon: XMark, href: '#', label: 'X (Twitter)' },
]

export default function Footer() {
  return (
    <footer className="bg-brand-black text-brand-white/70">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <img src="/images/brand/logo.png" alt="BlackStone Chauffeur" className="h-20 w-auto" />
            <p className="mt-3 text-sm">Premium chauffeur service, driven by excellence.</p>
            <div className="mt-5 flex gap-3">
              {social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
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
            <a href="tel:+64XXXXXXXXX" className="flex items-center gap-2 hover:text-brand-gold">
              <Phone size={14} /> +64 XX XXX XXXX
            </a>
            <a href="mailto:bookings@blackstonechauffeur.co.nz" className="flex items-center gap-2 hover:text-brand-gold">
              <Mail size={14} /> bookings@blackstonechauffeur.co.nz
            </a>
            <p className="flex items-center gap-2">
              <MapPin size={14} /> New Zealand
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BlackStone Chauffeur. All rights reserved.</p>
          <p className="text-brand-white/40">Built with care for a five-star ride.</p>
        </div>
      </div>
    </footer>
  )
}
