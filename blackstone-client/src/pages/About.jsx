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
import PageMeta from '../components/PageMeta'
import StatsBand from '../components/StatsBand'
import { IMAGES } from '../constants/images'

const CITIES = ['Queenstown', 'Auckland', 'Hamilton', 'Rotorua', 'Christchurch', 'Wellington', 'Napier', 'Taupō']

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
  { icon: UserCheck, title: 'Expert Chauffeurs', desc: 'All our chauffeurs are professionally trained, background checked, and dedicated to your comfort and safety.' },
  { icon: Car, title: 'Premium Fleet', desc: 'From luxury sedans to SUVs, our immaculately maintained vehicles provide the ultimate travel experience.' },
  { icon: Clock, title: '24/7 Availability', desc: 'We are available around the clock to ensure your transportation needs are always met, day or night.' },
  { icon: BadgeDollarSign, title: 'Competitive Pricing', desc: "Luxury doesn't have to break the bank. We offer transparent, competitive pricing with no hidden fees." },
  { icon: MapPin, title: 'NZ Wide Coverage', desc: 'Servicing Auckland, Hamilton, Tauranga, Wellington and surrounding areas across New Zealand.' },
  { icon: Heart, title: 'Personalised Service', desc: 'Every client receives our full attention. We tailor each journey to your specific requirements.' },
]

export default function About() {
  return (
    <div>
      <PageMeta
        title="About Us"
        description="Learn about BlackStone Chauffeur — New Zealand's premier luxury chauffeur service."
      />

      {/* Intro hero — half the viewport on first glance */}
      <section className="relative flex h-[50vh] min-h-[420px] w-full items-center overflow-hidden bg-brand-black text-white">
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

      {/* Core Values */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">What Drives Us</p>
          <h2 className="mt-2 font-heading text-3xl text-black">Our Core Values</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {coreValues.map((v) => (
              <div key={v.title} className="border border-black/10 p-6">
                <v.icon size={24} className="text-black" />
                <h3 className="mt-4 font-heading text-lg text-black">{v.title}</h3>
                <p className="mt-2 text-sm text-black/60">{v.desc}</p>
              </div>
            ))}
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
          <div className="mt-8 flex flex-wrap gap-3">
            {CITIES.map((city) => (
              <span
                key={city}
                className="flex items-center gap-2 border border-black/10 bg-white px-4 py-2 text-sm text-black"
              >
                <MapPin size={14} className="text-brand-gold" />
                {city}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-brand-black-soft py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Our Mission</p>
              <h2 className="mt-2 font-heading text-3xl">Delivering Excellence in Every Journey</h2>
              <p className="mt-4 text-white/70">
                At BlackStone Chauffeur, we are committed to providing the highest standard
                of luxury transportation across New Zealand. Our mission is simple — to
                exceed your expectations every single time.
              </p>
              <p className="mt-4 text-white/70">
                We believe every journey should be seamless, comfortable, and memorable.
                From the moment you book to the moment you arrive — your experience is
                our priority.
              </p>
            </div>
            <img
              src={IMAGES.aboutSecondary}
              alt="BlackStone Chauffeur professional driver"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* The BlackStone Difference */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Why BlackStone</p>
          <h2 className="mt-2 font-heading text-3xl text-black">The BlackStone Difference</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {differences.map((d) => (
              <div key={d.title} className="border border-black/10 p-6">
                <d.icon size={24} className="text-black" />
                <h3 className="mt-4 font-heading text-lg text-black">{d.title}</h3>
                <p className="mt-2 text-sm text-black/60">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
