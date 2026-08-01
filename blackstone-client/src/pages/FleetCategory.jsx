import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import FleetCard from '../components/FleetCard'
import { FLEET_CATEGORIES } from '../constants/fleet'

/**
 * Renders one of the two standalone fleet pages (Luxury or Comfort).
 * `category` is the internal key from FLEET_CATEGORIES ('luxury' | 'economy').
 */
export default function FleetCategory({ category }) {
  const config = FLEET_CATEGORIES[category]
  const vehicles = config.vehicles()
  const other = category === 'luxury' ? FLEET_CATEGORIES.economy : FLEET_CATEGORIES.luxury

  return (
    <div>
      <PageMeta
        title={config.label}
        description={`BlackStone Chauffeur's ${config.label.toLowerCase()} — ${config.intro}`}
      />

      {/* Intro hero */}
      <section className="relative flex h-[50vh] min-h-[420px] w-full items-center overflow-hidden bg-brand-black text-white">
        <img
          src={config.heroImage}
          alt={config.label}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">{config.eyebrow}</p>
          <h1 className="mt-2 font-heading text-5xl leading-tight md:text-6xl">{config.heading}</h1>
          <p className="mt-4 max-w-2xl text-white/70">{config.intro}</p>
        </div>
      </section>

      {/* Vehicle grid */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {vehicles.map((v) => (
              <FleetCard key={v.slug} vehicle={v} />
            ))}
          </div>
        </div>
      </section>

      {/* Cross-link to the other category */}
      <section className="border-t border-black/10 bg-black/[0.02] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center md:px-8">
          <p className="text-sm text-black/50">Looking for something different?</p>
          <Link to={`/fleet/${other.urlSlug}`} className="font-heading text-lg text-brand-gold hover:underline">
            View the {other.label} →
          </Link>
        </div>
      </section>
    </div>
  )
}
