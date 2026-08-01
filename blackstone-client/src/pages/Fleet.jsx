import PageMeta from '../components/PageMeta'
import FleetCard from '../components/FleetCard'
import { IMAGES } from '../constants/images'
import { LUXURY_FLEET, ECONOMY_FLEET } from '../constants/fleet'

export default function Fleet() {
  return (
    <div>
      <PageMeta
        title="Our Fleet"
        description="BlackStone Chauffeur's luxury and premium economy fleet — a vehicle for every occasion, professionally chauffeured across New Zealand."
      />

      {/* Intro hero — half the viewport, same style used across the site */}
      <section className="relative flex h-[50vh] min-h-[420px] w-full items-center overflow-hidden bg-brand-black text-white">
        <img
          src={IMAGES.fleet.mercedesSClass}
          alt="BlackStone Chauffeur fleet"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Our Fleet</p>
          <h1 className="mt-2 font-heading text-5xl leading-tight md:text-6xl">A Vehicle for Every Occasion</h1>
          <p className="mt-4 max-w-2xl text-white/70">
            From executive sedans to group vans, every vehicle is professionally chauffeured, immaculately presented, and ready for New Zealand roads.
          </p>
        </div>
      </section>

      {/* Luxury Fleet */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">Premium Class</p>
          <h2 className="mt-2 font-heading text-3xl text-black">Luxury Fleet</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {LUXURY_FLEET.map((v) => (
              <FleetCard key={v.slug} vehicle={v} />
            ))}
          </div>
        </div>
      </section>

      {/* Premium Economy Fleet */}
      <section className="bg-black/[0.03] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">Everyday Class</p>
          <h2 className="mt-2 font-heading text-3xl text-black">Premium Economy Fleet</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {ECONOMY_FLEET.map((v) => (
              <FleetCard key={v.slug} vehicle={v} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
