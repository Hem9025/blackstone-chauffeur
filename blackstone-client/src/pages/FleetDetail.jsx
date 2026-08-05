import { useParams, Link } from 'react-router-dom'
import { Users, Briefcase } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import { getVehicleBySlug, categoryPath } from '../constants/fleet'

export default function FleetDetail() {
  const { slug } = useParams()
  const vehicle = getVehicleBySlug(slug)

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center md:px-8">
        <h1 className="font-heading text-3xl text-black">Vehicle Not Found</h1>
        <p className="mt-4 text-black/60">
          We couldn't find that vehicle. Have a look at our full fleet instead.
        </p>
        <Button to="/fleet/luxury" className="mt-8">Back to Fleet</Button>
      </div>
    )
  }

  const backTo = categoryPath(vehicle.category)

  return (
    <div>
      <PageMeta title={vehicle.title} description={vehicle.shortDesc} image={vehicle.heroImage} />

      {/* Framed photo on top with a gold tagline badge, then a dark info
          card that overlaps its bottom edge — a more editorial, "product
          hero" treatment than a flat stack. object-contain (not
          object-cover) so the whole vehicle is always visible regardless
          of that particular photo's own proportions, sitting on a soft
          gradient backdrop so the letterboxing still looks intentional. */}
      <section className="bg-white pt-8 md:pt-12">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Link to={backTo} className="text-sm uppercase tracking-[0.2em] text-brand-gold hover:underline">
            ← All Vehicles
          </Link>

          <div className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-black/[0.04] to-black/[0.08] shadow-lg">
            <span className="absolute left-6 top-6 z-10 rounded-full bg-brand-gold px-4 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-brand-black shadow">
              {vehicle.tagline}
            </span>
            <div className="aspect-[4/3] p-6 sm:aspect-[16/9] md:min-h-[440px] md:p-10 lg:min-h-[540px]">
              <img
                src={vehicle.heroImage}
                alt={vehicle.title}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="relative z-10 mx-auto -mt-10 max-w-4xl rounded-3xl bg-brand-black px-6 py-10 text-white shadow-2xl sm:-mt-14 md:px-12 md:py-12">
            <h1 className="font-heading text-4xl leading-tight md:text-5xl">{vehicle.title}</h1>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80">
                <Users size={16} className="text-brand-gold" /> {vehicle.passengers} Passengers
              </span>
              <span className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80">
                <Briefcase size={16} className="text-brand-gold" /> {vehicle.luggage} Luggage
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-4 text-white/70">
              {vehicle.description.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* The Sprinter is a group vehicle handled via custom quote
                rather than instant online booking — see quoteOnly on its
                entry in constants/fleet.js. */}
            {vehicle.quoteOnly ? (
              <Button to="/contact" className="mt-8">Get a Quote</Button>
            ) : (
              <Button to="/booking" className="mt-8">Book Now</Button>
            )}
          </div>
        </div>
      </section>

      {/* Detail gallery — modern rounded grid, replaces the dated circular-thumbnail layout */}
      <section className="bg-black/[0.03] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">A Closer Look</p>
          <h2 className="mt-2 font-heading text-2xl text-black">{vehicle.title} Details</h2>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {vehicle.gallery.map((shot) => (
              <figure key={shot.title + shot.src} className="overflow-hidden rounded-2xl bg-white">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={shot.src}
                    alt={shot.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <figcaption className="p-3">
                  <p className="font-heading text-sm text-black">{shot.title}</p>
                  <p className="mt-1 text-xs text-black/50">{shot.desc}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
