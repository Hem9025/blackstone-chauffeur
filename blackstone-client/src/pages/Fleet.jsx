import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import FleetCard from '../components/FleetCard'
import { IMAGES } from '../constants/images'
import { LUXURY_FLEET, ECONOMY_FLEET } from '../constants/fleet'
import { breadcrumbJsonLd, serviceJsonLd } from '../constants/seo'

const FLEET_JSON_LD = [
  breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Fleet', path: '/fleet/luxury' },
  ]),
  serviceJsonLd({
    name: 'Chauffeured Fleet Hire',
    description:
      'Luxury sedans, SUVs, vans and executive vehicles, professionally chauffeured for airport transfers, weddings, and corporate travel across New Zealand.',
    path: '/fleet/luxury',
  }),
]

export default function Fleet() {
  return (
    <div>
      <PageMeta
        title="Our Fleet | Luxury & Comfort Chauffeured Vehicles"
        description="BlackStone Chauffeur's luxury and comfort-class fleet — sedans, SUVs, vans and executive vehicles for airport transfers, weddings, and corporate travel, professionally chauffeured across New Zealand."
        jsonLd={FLEET_JSON_LD}
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

          {/* Contextual cross-links to Services and Booking. */}
          <div className="mt-12 flex flex-wrap items-center gap-4 rounded-3xl border border-black/10 bg-white p-8">
            <div className="flex-1">
              <h3 className="font-heading text-xl text-black">Wondering what each vehicle is best for?</h3>
              <p className="mt-1 text-sm text-black/60">
                See our full <Link to="/services" className="text-brand-gold underline">Services</Link> — airport
                transfers, weddings, corporate travel and more — then book the vehicle that fits.
              </p>
            </div>
            <Button to="/booking" className="!px-6 !py-3">Book Now</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
