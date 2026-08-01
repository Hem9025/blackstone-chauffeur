import { useEffect, useState } from 'react'
import { ShieldCheck, BadgeDollarSign, Lock, Star } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import Reveal from '../components/Reveal'
import FleetCard from '../components/FleetCard'
import FaqAccordion from '../components/FaqAccordion'
import QuickBookWidget from '../components/QuickBookWidget'
import TestimonialCard from '../components/TestimonialCard'
import StatsBand from '../components/StatsBand'
import OccasionStrip from '../components/OccasionStrip'
import { IMAGES } from '../constants/images'
import { LUXURY_FLEET } from '../constants/fleet'
import { reviews as reviewsApi } from '../utils/api'

const services = [
  { title: 'Airport Transfers', desc: 'Punctual meet & greet transfers to and from every major terminal.', image: IMAGES.services.airport },
  { title: 'Corporate Travel', desc: 'Reliable chauffeur service for executives and business events.', image: IMAGES.services.corporate },
  { title: 'Weddings & Events', desc: 'Arrive in style on the most important days.', image: IMAGES.services.wedding },
  { title: 'Private Tours', desc: 'Bespoke sightseeing with a professional local driver.', image: IMAGES.services.tour },
]

const features = [
  { icon: ShieldCheck, title: 'Safety First', desc: 'Licensed, background-checked chauffeurs and regularly serviced vehicles.' },
  { icon: BadgeDollarSign, title: 'Transparent Pricing', desc: 'Your total is confirmed before you book — no surprise fees on arrival.' },
  { icon: Lock, title: 'Private & Discreet', desc: 'Professional, confidential service for business and personal travel alike.' },
]

const testimonials = [
  { name: 'Sarah M.', role: 'Corporate Client', quote: 'Immaculate car, and the driver tracked our delayed flight without us even asking. Exactly the reliability we need for client pickups.', avatar: IMAGES.testimonialAvatars[0] },
  { name: 'James H.', role: 'Wedding Booking', quote: 'Booked the wedding car package — punctual, beautifully presented, and made the whole day feel effortless.', avatar: IMAGES.testimonialAvatars[1] },
  { name: 'Priya R.', role: 'Airport Transfer', quote: 'Simple online booking, clear pricing upfront, and a genuinely five-star ride. Will be using BlackStone again.', avatar: IMAGES.testimonialAvatars[2] },
]

const homeStats = [
  { value: '3+', label: 'Years' },
  { value: '100+', label: 'Reviews' },
  { value: '700+', label: 'Customers' },
]

const faqs = [
  { question: 'How far in advance should I book?', answer: 'We recommend booking at least 3 days ahead, though we do our best to accommodate last-minute requests.' },
  { question: 'Do you provide airport meet & greet?', answer: "Yes — our chauffeurs track your flight and will be waiting in the arrivals hall with a name board." },
  { question: 'Can I add extras to my booking?', answer: 'Absolutely. Child seats, extra wait time, VIP airport pickup and more can be added when selecting your vehicle.' },
  { question: 'What payment methods do you accept?', answer: 'All major credit and debit cards via our secure Stripe checkout.' },
]

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'BlackStone Chauffeur',
  description: 'Premium chauffeur service offering airport transfers, corporate travel, weddings and private tours across New Zealand.',
  url: 'https://www.blackstonechauffeur.co.nz',
  telephone: '+64-XX-XXX-XXXX',
  priceRange: '$$$',
  address: { '@type': 'PostalAddress', addressCountry: 'NZ' },
}

export default function Home() {
  const fleetPreview = LUXURY_FLEET.slice(0, 3)
  const [googleReviews, setGoogleReviews] = useState(null)

  useEffect(() => {
    reviewsApi
      .get()
      .then((data) => setGoogleReviews(data?.configured && data.reviews?.length ? data : null))
      .catch(() => setGoogleReviews(null))
  }, [])

  return (
    <div>
      <PageMeta
        title="Premium Chauffeur Service"
        description="BlackStone Chauffeur offers premium airport transfers, corporate travel and event chauffeuring across New Zealand."
        jsonLd={localBusinessJsonLd}
      />

      {/* Hero — full viewport on first glance, nav floats transparent on top */}
      <section className="relative h-screen w-full overflow-hidden bg-brand-black text-white">
        <img
          src={IMAGES.hero}
          alt="BlackStone Chauffeur luxury vehicle"
          className="absolute inset-0 h-full w-full object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex flex-1 items-center px-4 md:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <div className="flex max-w-xl flex-col gap-6">
                <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">
                  Premium Chauffeur Service
                </p>
                <h1 className="font-heading text-5xl leading-tight md:text-6xl">
                  Arrive in style, every time.
                </h1>
                <p className="max-w-md text-white/70">
                  BlackStone Chauffeur delivers black-tie transport for airport transfers,
                  corporate travel, weddings and private tours — driven by professionals
                  who put your schedule first.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full px-4 pb-8 md:px-8 md:pb-10">
            <div className="mx-auto max-w-7xl">
              <QuickBookWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <Reveal variant="fade">
        <StatsBand
          heading="A New Standard of Luxury Travel and Comfort"
          description="BlackStone Chauffeur has proudly served clients across New Zealand for over 3 years, delivering unmatched luxury transportation with professionalism and care."
          stats={homeStats}
        />
      </Reveal>

      {/* Trusted strip */}
      <section className="border-b border-black/10 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-black/40">
            Trusted for airport, corporate & wedding transport
          </p>
        </div>
      </section>

      {/* Fleet preview */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="flex items-end justify-between">
              <h2 className="font-heading text-3xl text-black">Our Fleet</h2>
              <Button to="/fleet/luxury" variant="secondary" className="hidden sm:inline-flex">
                View All Fleet
              </Button>
            </div>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {fleetPreview.map((v, i) => (
              <Reveal key={v.slug} delay={i * 100}>
                <FleetCard vehicle={v} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="bg-brand-black-soft py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <h2 className="font-heading text-3xl text-white">Why Choose BlackStone</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} variant="scale" delay={i * 100}>
                <div className="border border-white/10 p-6">
                  <f.icon size={24} className="text-white" />
                  <h3 className="mt-4 font-heading text-lg text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="flex items-end justify-between">
              <h2 className="font-heading text-3xl text-black">Our Services</h2>
              <Button to="/services" variant="secondary" className="hidden sm:inline-flex">
                See All Services
              </Button>
            </div>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="group overflow-hidden border border-black/10">
                  <div className="h-40 overflow-hidden">
                    <img
                      src={s.image}
                      alt={s.title}
                      className="h-full w-full object-cover grayscale-[15%] transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-lg text-black">{s.title}</h3>
                    <p className="mt-2 text-sm text-black/60">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Special Occasions — horizontal strips */}
      <Reveal variant="left">
        <OccasionStrip
          eyebrow="Special Occasions"
          title="Wedding Car Hire in New Zealand"
          paragraphs={[
            "Make your special day even more memorable with our luxury wedding car hire service. Arrive in elegance and style with our impeccably presented fleet and professional chauffeurs dedicated to making your day perfect.",
            'We offer tailored wedding packages to suit your needs, ensuring every detail is perfect from pickup to reception venue.',
          ]}
          image={IMAGES.services.wedding}
          cta={{ label: 'Enquire Now', to: '/contact' }}
        />
      </Reveal>

      <Reveal variant="right">
        <OccasionStrip
          eyebrow="Events"
          title="School Ball & Special Events"
          paragraphs={[
            'Arrive in style at your school ball or special event. We provide safe, reliable, and luxurious transportation for students and groups — making your night one to remember.',
            'Our experienced chauffeurs ensure you get there and back safely, so you can focus on enjoying your special night in absolute style and comfort.',
          ]}
          image={IMAGES.services.special}
          cta={{ label: 'Book Your Night', to: '/booking' }}
          reverse
          dark
        />
      </Reveal>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-heading text-3xl text-black">What Riders Say</h2>
              {googleReviews && (
                <a
                  href={googleReviews.placeUrl || 'https://www.google.com/maps'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sm text-black/60 hover:text-brand-gold"
                >
                  <Star size={14} className="text-brand-gold" fill="currentColor" strokeWidth={0} />
                  {googleReviews.rating} · {googleReviews.totalReviews} Google reviews
                </a>
              )}
            </div>
            {!googleReviews && (
              <p className="mt-2 text-sm text-black/50">
                Sample testimonials — replace with real client reviews once collected.
              </p>
            )}
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {(googleReviews ? googleReviews.reviews.slice(0, 3) : testimonials).map((t, i) =>
              googleReviews ? (
                <Reveal key={`${t.author}-${t.time}`} delay={i * 100}>
                  <TestimonialCard
                    name={t.author}
                    role={t.relativeTime}
                    quote={t.text}
                    avatar={t.avatar}
                  />
                </Reveal>
              ) : (
                <Reveal key={t.name} delay={i * 100}>
                  <TestimonialCard {...t} />
                </Reveal>
              ),
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <Reveal variant="fade">
          <h2 className="font-heading text-3xl text-black">Frequently Asked Questions</h2>
          <div className="mt-8">
            <FaqAccordion items={faqs} />
          </div>
        </Reveal>
      </section>
    </div>
  )
}
