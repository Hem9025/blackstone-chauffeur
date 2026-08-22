import {
  Award,
  Sparkles,
  Car,
  Clock,
  UserCheck,
  BadgeDollarSign,
  MapPin,
  Heart,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import StatsBand from '../components/StatsBand'
import Button from '../components/Button'
import { IMAGES } from '../constants/images'
import { organizationJsonLd, breadcrumbJsonLd, CITIES_SERVED } from '../constants/seo'

// Placeholder photography reused from the existing stock set (see
// constants/images.js) — swap each `image` for a real per-city photo
// whenever the client supplies one. A couple of these are regional
// stand-ins rather than the city itself (no exact match existed yet):
// Hamilton uses a Waikato-region shot, and Wellington/Napier/Taupō use
// generic scenic placeholders.
const CITIES = [
  { name: 'Queenstown', image: IMAGES.places.queenstown },
  { name: 'Auckland', image: IMAGES.places.skyTower },
  { name: 'Hamilton', image: IMAGES.places.waitomoCaves },
  { name: 'Rotorua', image: IMAGES.places.rotoruaGeothermal },
  { name: 'Christchurch', image: IMAGES.places.christchurch },
  { name: 'Wellington', image: IMAGES.places.milfordSoundAlt },
  { name: 'Napier', image: IMAGES.places.pihaBeachAlt },
  { name: 'Taupō', image: IMAGES.places.bayOfIslands },
]

const stats = [
  { value: '3+', label: 'Years' },
  { value: '100+', label: 'Reviews' },
  { value: '700+', label: 'Customers' },
]

const coreValues = [
  { icon: Award, title: 'Professionalism', desc: 'Dedicated to providing the highest standard of chauffeur services across New Zealand.' },
  { icon: Sparkles, title: 'Tailored Experiences', desc: 'Bespoke services for weddings, corporate events, and sightseeing across New Zealand.' },
  { icon: Car, title: 'Luxurious Fleet', desc: 'Providing a wide selection of premium and economical vehicles for every occasion.' },
  { icon: Clock, title: 'Reliability', desc: 'Count on us for punctual, dependable transportation designed to meet your needs.' },
]

const differences = [
  { icon: UserCheck, title: 'Expert Chauffeurs', desc: 'All our chauffeurs are professionally trained, background checked, and dedicated to your comfort and safety.', image: IMAGES.services.businessMeeting },
  { icon: Car, title: 'Premium Fleet', desc: 'From luxury sedans to SUVs, our immaculately maintained vehicles provide the ultimate travel experience.', image: IMAGES.services.luxuryFleet },
  { icon: Clock, title: '24/7 Availability', desc: 'We are available around the clock to ensure your transportation needs are always met, day or night.', image: IMAGES.services.airport },
  { icon: BadgeDollarSign, title: 'Competitive Pricing', desc: "Luxury doesn't have to break the bank. We offer transparent, competitive pricing with no hidden fees.", image: IMAGES.services.pointToPoint },
  // City list kept in sync with CITIES_SERVED (constants/seo.js) — this used
  // to list a different, shorter set of cities (including one, Tauranga,
  // that isn't actually one of the eight served) than the Footer and
  // "Where We Operate" section below, which is exactly the kind of
  // service-area inconsistency across pages the SEO plan flagged.
  { icon: MapPin, title: 'NZ Wide Coverage', desc: `Servicing ${CITIES_SERVED.join(', ')} and surrounding areas across New Zealand.`, image: IMAGES.places.queenstown },
  { icon: Heart, title: 'Personalised Service', desc: 'Every client receives our full attention. We tailor each journey to your specific requirements.', image: IMAGES.services.vip },
]

const ABOUT_JSON_LD = [
  organizationJsonLd,
  breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ]),
]

export default function About() {
  return (
    <div>
      <PageMeta
        title="About Us | New Zealand's Premier Chauffeur Service"
        description="BlackStone Chauffeur has served clients across Auckland, Wellington, Hamilton, Rotorua, Christchurch and Queenstown for over 3 years — professional chauffeurs, a premium fleet, and 24/7 availability."
        jsonLd={ABOUT_JSON_LD}
      />

      {/* Intro hero — 70% of the viewport on first glance */}
      <section className="relative flex h-[70vh] min-h-[560px] w-full items-center overflow-hidden bg-brand-black text-white">
        <img
          src={IMAGES.about}
          alt="BlackStone Chauffeur"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <h1 className="font-heading text-5xl leading-tight md:text-6xl">About Us</h1>
        </div>
      </section>

      {/* Who We Are + numbers — combined horizontal strip */}
      <StatsBand
        eyebrow="Who We Are"
        heading="New Zealand's Premier Luxury Chauffeur Service"
        description={[
          'Founded with a passion for excellence, BlackStone Chauffeur has been serving clients across New Zealand with the highest standard of luxury transportation.',
          'From airport transfers to wedding car hire, corporate travel to private tours — we deliver an unmatched experience tailored to your every need.',
        ]}
        stats={stats}
        dark={false}
      />

      {/* Core Values — text left, image right. Light tint (not white) so
          "What Drives Us" reads as visually distinct from the white "Who We
          Are" band directly above it. */}
      <section className="bg-black/[0.02] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">What Drives Us</p>
              <h2 className="mt-2 font-heading text-3xl text-black md:text-4xl">Our Core Values</h2>
              <p className="mt-4 max-w-md text-black/60">
                Four principles that shape every booking, every driver, and every journey we run.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {coreValues.map((v) => (
                  <div key={v.title} className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gold/10">
                      <v.icon size={20} className="text-brand-gold" />
                    </span>
                    <div>
                      <h3 className="font-heading text-base text-black">{v.title}</h3>
                      <p className="mt-1 text-sm text-black/60">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl md:aspect-[3/4]">
              <img
                src={IMAGES.gallery[3]}
                alt="BlackStone Chauffeur team greeting guests"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Where We Operate */}
      <section className="bg-black/[0.02] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Nationwide Coverage</p>
          <h2 className="mt-2 font-heading text-3xl text-black">Where We Operate</h2>
          <p className="mt-4 max-w-2xl text-black/60">
            BlackStone Chauffeur provides premium chauffeur transport in destinations across
            both islands of New Zealand.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-8 sm:flex-nowrap sm:justify-between sm:overflow-x-auto sm:pb-2">
            {CITIES.map((city) => (
              <div key={city.name} className="flex shrink-0 flex-col items-center gap-3">
                {/* Gold ring is a real border (inside the box, border-box
                    sizing) instead of a ring-offset box-shadow — the
                    shadow-based ring was getting clipped at the top/side by
                    the row's overflow-x-auto on wider screens, since a
                    box-shadow can render outside its element's own bounds
                    but a border never does. */}
                <div className="h-24 w-24 shrink-0 rounded-full border-2 border-brand-gold/40 p-1 md:h-28 md:w-28">
                  <div className="h-full w-full overflow-hidden rounded-full">
                    {/* object-position biased toward the upper-middle rather
                        than dead centre — several of these photos (e.g. Sky
                        Tower) have their subject higher in frame, and a plain
                        centre crop was cutting the top off inside the circle. */}
                    <img
                      src={city.image}
                      alt={city.name}
                      className="h-full w-full object-cover object-[50%_25%]"
                    />
                  </div>
                </div>
                <p className="text-sm font-medium text-black">{city.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission — image runs the full height of the section, edge to edge,
          rather than sitting inset with padding like a normal content block. */}
      <section className="bg-brand-black-soft text-white">
        <div className="mx-auto max-w-7xl md:px-8">
          <div className="grid grid-cols-1 md:min-h-[520px] md:grid-cols-2">
            <div className="flex flex-col justify-center gap-4 px-4 py-16 md:px-12 md:py-0">
              <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Our Mission</p>
              <h2 className="font-heading text-3xl">Delivering Excellence in Every Journey</h2>
              <p className="mt-2 text-white/70">
                At BlackStone Chauffeur, we are committed to providing the highest standard
                of luxury transportation across New Zealand. Our mission is simple — to
                exceed your expectations every single time.
              </p>
              <p className="text-white/70">
                We believe every journey should be seamless, comfortable, and memorable.
                From the moment you book to the moment you arrive — your experience is
                our priority.
              </p>
            </div>
            <div className="aspect-[4/3] overflow-hidden md:aspect-auto md:h-full">
              <img
                src={IMAGES.aboutSecondary}
                alt="BlackStone Chauffeur BMW 7 Series on the road"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The BlackStone Difference — image-led cards instead of plain
          icon+text boxes */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Why BlackStone</p>
          <h2 className="mt-2 font-heading text-3xl text-black">The BlackStone Difference</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {differences.map((d) => (
              <div key={d.title} className="group relative aspect-[4/5] overflow-hidden rounded-2xl">
                <img
                  src={d.image}
                  alt={d.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/5" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/90">
                    <d.icon size={18} className="text-brand-black" />
                  </span>
                  <h3 className="mt-3 font-heading text-lg text-white">{d.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA — links into Services and Booking, since the rest of
          this page is brand storytelling with no path onward otherwise. */}
      <section className="border-t border-black/10 bg-black/[0.02] py-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center md:px-8">
          <h2 className="font-heading text-2xl text-black">Ready to ride with BlackStone?</h2>
          <p className="text-black/60">
            See our full <Link to="/services" className="text-brand-gold underline">range of services</Link> or
            browse the <Link to="/fleet/luxury" className="text-brand-gold underline">fleet</Link>, then book online in minutes.
          </p>
          <Button to="/booking" className="!px-6 !py-3">Book Now</Button>
        </div>
      </section>
    </div>
  )
}
