import { Link, useSearchParams } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import FleetCard from '../components/FleetCard'
import { FLEET_CATEGORIES } from '../constants/fleet'

const TYPE_LABELS = { sedan: 'Sedan', suv: 'SUV', van: 'Van', sprinter: 'Sprinter' }

/**
 * Renders one of the two standalone fleet pages (Luxury or Comfort).
 * `category` is the internal key from FLEET_CATEGORIES ('luxury' | 'economy').
 * Supports an optional ?type=sedan|suv|van filter (used by the homepage's
 * category tiles) — falls back to the full list if the type is missing,
 * unrecognised, or matches nothing.
 */
export default function FleetCategory({ category }) {
  const config = FLEET_CATEGORIES[category]
  const allVehicles = config.vehicles()
  const other = category === 'luxury' ? FLEET_CATEGORIES.economy : FLEET_CATEGORIES.luxury

  const [searchParams, setSearchParams] = useSearchParams()
  const typeFilter = searchParams.get('type')
  const filtered = typeFilter ? allVehicles.filter((v) => v.bodyType === typeFilter) : allVehicles
  // An empty filtered result (e.g. a body type with zero vehicles right now)
  // falls back to showing the full category rather than a dead end.
  const vehicles = filtered.length ? filtered : allVehicles
  const showingFallback = Boolean(typeFilter) && filtered.length === 0

  return (
    <div>
      <PageMeta
        title={config.label}
        description={`BlackStone Chauffeur's ${config.label.toLowerCase()} — ${config.intro}`}
      />

      {/* Intro hero — 70% of the viewport on first glance */}
      <section className="relative flex h-[70vh] min-h-[560px] w-full items-center overflow-hidden bg-brand-black text-white">
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
          {typeFilter && TYPE_LABELS[typeFilter] && (
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <span className="border border-brand-gold/40 bg-brand-gold/10 px-3 py-1.5 text-sm text-brand-black">
                Showing: {TYPE_LABELS[typeFilter]}
              </span>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="text-sm text-black/50 hover:text-brand-gold hover:underline"
              >
                Clear filter — view all {config.label}
              </button>
            </div>
          )}
          {showingFallback && (
            <p className="mb-8 text-sm text-black/50">
              No {TYPE_LABELS[typeFilter]?.toLowerCase()} vehicles are listed here yet — showing the full {config.label} instead.
            </p>
          )}
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
