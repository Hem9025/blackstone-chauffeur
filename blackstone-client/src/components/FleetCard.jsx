import { Link } from 'react-router-dom'
import { Users, Briefcase } from 'lucide-react'

export default function FleetCard({ vehicle }) {
  return (
    <Link
      to={`/fleet/${vehicle.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="aspect-[4/3] overflow-hidden bg-black/5">
        <img
          src={vehicle.heroImage}
          alt={vehicle.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
