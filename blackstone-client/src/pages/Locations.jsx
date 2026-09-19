import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import { LOCATIONS } from '../constants/locations'
import { breadcrumbJsonLd } from '../constants/seo'

const LOCATIONS_JSON_LD = [
  breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Locations', path: '/locations' },
  ]),
]

export default function Locations() {
  return (
    <div>
      <PageMeta
        title="Locations We Serve | Auckland & NZ"
        description="VVIP, corporate and wedding chauffeur service across Auckland, Wellington, Hamilton, Rotorua, Christchurch, Napier, Taupō and Queenstown."
        jsonLd={LOCATIONS_JSON_LD}
      />

      {/* Intro hero — half the viewport, same style as Tour/Services */}
      <section className="relative flex h-[50vh] min-h-[420px] w-full items-center overflow-hidden bg-brand-black text-white">
        <img
          src={LOCATIONS[0].image}
          alt="BlackStone Chauffeur locations across New Zealand"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Locations We Serve</p>
          <h1 className="mt-2 font-heading text-5xl leading-tight md:text-6xl">Chauffeur Service Across New Zealand</h1>
          <p className="mt-4 max-w-2xl text-white/70">
            VVIP, corporate and wedding transport in eight cities — from Auckland Airport to Queenstown's ski fields.
          </p>
        </div>
      </section>

      {/* Location grid */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {LOCATIONS.map((l) => (
              <Link
                key={l.slug}
                to={`/locations/${l.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-black/10 transition-colors hover:border-brand-gold"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={l.image}
                    alt={l.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-heading text-lg text-black">{l.name}</h2>
                  <p className="mt-2 text-sm text-black/60">{l.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
