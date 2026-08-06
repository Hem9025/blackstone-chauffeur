import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Briefcase } from 'lucide-react'

export default function FleetCard({ vehicle }) {
  // Most fleet photos are landscape exterior shots, which fill the card
  // edge-to-edge nicely under object-cover. A handful of source photos
  // come in portrait, which object-cover would crop awkwardly (cutting
  // off the car). Detected from the actual loaded image (naturalWidth/
  // Height) rather than hardcoded per vehicle, so it's automatically
  // correct even if a photo is swapped later. Portrait photos fall back
  // to a padded, rounded grey backdrop with object-contain instead, so
  // the whole car still shows — the rounding matches the card itself, so
  // there's no grey visible outside the card's own corners, just white.
  const [isPortrait, setIsPortrait] = useState(false)

  return (
    <Link
      to={`/fleet/${vehicle.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div
        className={`aspect-[4/3] overflow-hidden ${
          isPortrait ? 'bg-gradient-to-br from-black/[0.04] to-black/[0.08] p-5' : 'bg-black/5'
        }`}
      >
        <img
          src={vehicle.heroImage}
          alt={vehicle.title}
          onLoad={(e) => setIsPortrait(e.currentTarget.naturalHeight > e.currentTarget.naturalWidth)}
          className={`h-full w-full transition-transform duration-500 ${
            isPortrait ? 'object-contain' : 'object-cover group-hover:scale-105'
          }`}
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">{vehicle.tagline}</p>
        <h3 className="mt-2 font-heading text-xl text-black">{vehicle.title}</h3>
        <p className="mt-2 text-sm text-black/60">{vehicle.shortDesc}</p>

        <div className="mt-5 flex items-center gap-3 border-t border-black/10 pt-4 text-sm text-black/70">
          <span className="flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1">
            <Users size={14} className="text-brand-gold" /> {vehicle.passengers}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1">
            <Briefcase size={14} className="text-brand-gold" /> {vehicle.luggage}
          </span>
        </div>
      </div>
    </Link>
  )
}
