import { Link } from 'react-router-dom'
import { Users, Briefcase } from 'lucide-react'

export default function FleetCard({ vehicle }) {
  return (
    <Link
      to={`/fleet/${vehicle.slug}`}
      className="group flex flex-col overflow-hidden border border-black/10 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-black/5">
        <img
          src={vehicle.heroImage}
          alt={vehicle.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">{vehicle.tagline}</p>
        <h3 className="mt-2 font-heading text-xl text-black">{vehicle.title}</h3>
        <p className="mt-2 text-sm text-black/60">{vehicle.shortDesc}</p>

        <div className="mt-5 flex items-center gap-5 border-t border-black/10 pt-4 text-sm text-black/70">
          <span className="flex items-center gap-2">
            <Users size={16} className="text-brand-gold" /> {vehicle.passengers}
          </span>
          <span className="flex items-center gap-2">
            <Briefcase size={16} className="text-brand-gold" /> {vehicle.luggage}
          </span>
        </div>
      </div>
    </Link>
  )
}
