import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import { IMAGES } from '../constants/images'
import { breadcrumbJsonLd, serviceJsonLd } from '../constants/seo'

const services = [
  { title: 'Airport Transfers', desc: 'Effortless airport transfers, with guaranteed on-time arrivals and departures, ensuring a hassle-free and smooth travel experience every time.', image: IMAGES.services.airport },
  { title: 'Corporate Travel', desc: 'Professional chauffeurs for executive transportation, ensuring a comfortable and perfect experience for business travelers.', image: IMAGES.services.corporate },
  { title: 'Hourly Hire', desc: 'Flexible options for clients who require chauffeur services on an hourly basis, ideal for events or meetings.', image: IMAGES.services.hourly },
  { title: 'Wedding Transfers', desc: 'Reliable, stylish, and on-time chauffeur services for your special day. Book now!', image: IMAGES.services.wedding },
  { title: 'Night Club Transfers', desc: "Ride in style. Party safe. We've got your night out covered.", image: IMAGES.services.nightclub },
  { title: 'VIP Service', desc: 'Exclusive services tailored for VIP guests, ensuring a luxurious and personalized experience.', image: IMAGES.services.vip },
  { title: 'Business Meetings', desc: 'Reliable transportation to and from business meetings, contributing to a professional image and a successful outcome.', image: IMAGES.services.businessMeeting },
  { title: 'City Tours', desc: "Expert-led tours featuring the city's top attractions, delivering an immersive and educational experience for guests, and a richer understanding of the local culture and landmarks.", image: IMAGES.services.tour },
  { title: 'Special Events', desc: 'Transportation for weddings, parties, or other special occasions, providing a touch of elegance and sophistication.', image: IMAGES.services.special },
  { title: 'Point-to-point Transfer', desc: 'Convenient transfers between specific locations, offering a hassle-free experience and saving valuable time.', image: IMAGES.services.pointToPoint },
  { title: 'Sightseeing Excursions', desc: "Tailored excursions to local landmarks and attractions, enhancing the guest's exploration and appreciation of the city.", image: IMAGES.services.sightseeing },
  { title: 'Luxury Fleet Options', desc: 'A diverse fleet of high-end vehicles, providing options based on guest preferences, including luxury sedans, SUVs, and vans.', image: IMAGES.services.luxuryFleet },
]

const highlights = [
  'Luxurious Vehicles',
  'Professional Chauffeurs',
  'Personalized Experience',
  'Concierge Services',
]

const SERVICES_JSON_LD = [
  breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
  ]),
  serviceJsonLd({
    name: 'Chauffeur Services',
    description:
      'Airport transfers, corporate travel, wedding cars, VIP service, city tours and hourly hire, chauffeured across Auckland and New Zealand.',
    path: '/services',
  }),
]

export default function Services() {
  return (
    <div>
      <PageMeta
        title="Chauffeur Services Auckland | Airport Transfers, Weddings & Corporate Travel"
        description="Airport transfers, corporate travel, wedding cars, VIP service, and city tours from BlackStone Chauffeur — professional chauffeurs across Auckland and New Zealand, booked online with upfront pricing."
        jsonLd={SERVICES_JSON_LD}
      />

      {/* Intro hero — 70% of the viewport, same style as About */}
      <section className="relative flex h-[70vh] min-h-[560px] w-full items-center overflow-hidden bg-brand-black text-white">
        <img
          src={IMAGES.services.corporate}
          alt="BlackStone Chauffeur services"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Chauffeur Services in Auckland &amp; NZ</p>
          <h1 className="mt-2 font-heading text-5xl leading-tight md:text-6xl">Our Services</h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Airport transfers, corporate travel, weddings, and private tours — every ride professionally
            chauffeured across Auckland, Wellington, Hamilton, Rotorua, Christchurch, and Queenstown.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">What We Offer</p>
          <h2 className="mt-2 font-heading text-3xl text-black">Our Premium Chauffeur Services</h2>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="flex flex-col overflow-hidden rounded-3xl border border-black/10">
                {/* Fills the box edge-to-edge on every side, no letterboxing
                    or padding gaps — a taller box than before so it still
                    doesn't feel over-cropped. */}
                <div className="h-60 overflow-hidden">
                  <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-heading text-lg text-black">{s.title}</h3>
                  <p className="mt-2 text-sm text-black/60">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contextual cross-links to Fleet and Booking — helps visitors
              (and search engines) move naturally from "what you offer" to
              "what I'd ride in" to "book it", rather than relying only on
              the navbar/footer to connect these three pages. */}
          <div className="mt-12 flex flex-wrap items-center gap-4 rounded-3xl border border-black/10 bg-black/[0.02] p-8">
            <div className="flex-1">
              <h3 className="font-heading text-xl text-black">Not sure which vehicle fits your trip?</h3>
              <p className="mt-1 text-sm text-black/60">
                Browse our <Link to="/fleet/luxury" className="text-brand-gold underline">Luxury</Link> and{' '}
                <Link to="/fleet/comfort" className="text-brand-gold underline">Comfort</Link> fleets, or go straight to booking.
              </p>
            </div>
            <Button to="/booking" className="!px-6 !py-3">Book Now</Button>
          </div>
        </div>
      </section>

      {/* Superb Vehicles */}
      <section className="bg-brand-black-soft text-white">
        <div className="mx-auto max-w-7xl md:px-8">
          <div className="grid grid-cols-1 md:min-h-[480px] md:grid-cols-2">
            <div className="flex flex-col justify-center gap-4 px-4 py-12 md:px-12 md:py-0">
              <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Superb Vehicles</p>
              <h2 className="font-heading text-3xl">Travel in Absolute Luxury</h2>
              <p className="text-white/70">
                BlackStone Chauffeur ensures every passenger enjoys a luxurious journey
                across New Zealand with the finest vehicles and professional chauffeurs.
              </p>
              <ul className="mt-2 flex flex-col gap-3">
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-white/90">
                    <CheckCircle size={18} className="text-brand-gold" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <div className="aspect-[4/3] overflow-hidden md:aspect-auto md:h-full">
              <img
                src={IMAGES.fleet.sedan2}
                alt="BlackStone Chauffeur luxury fleet"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
