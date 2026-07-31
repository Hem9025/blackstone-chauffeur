import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-brand-black text-brand-white/70">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-heading text-lg text-brand-gold">BlackStone Chauffeur</h3>
            <p className="mt-2 text-sm">Premium chauffeur service, driven by excellence.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/services" className="hover:text-brand-gold">Services</Link>
            <Link to="/fleet/luxury" className="hover:text-brand-gold">Luxury Fleet</Link>
            <Link to="/contact" className="hover:text-brand-gold">Contact</Link>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/terms" className="hover:text-brand-gold">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="hover:text-brand-gold">Privacy Policy</Link>
          </div>
        </div>
        <div className="mt-8 border-t border-brand-black-soft pt-6 text-xs">
          © {new Date().getFullYear()} BlackStone Chauffeur. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
