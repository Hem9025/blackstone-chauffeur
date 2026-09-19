import { useParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import FaqAccordion from '../components/FaqAccordion'
import EnquiryForm from '../components/EnquiryForm'
import { LOCATIONS, getLocationBySlug, locationFaqs } from '../constants/locations'
import { breadcrumbJsonLd, serviceJsonLd, faqJsonLd } from '../constants/seo'

export default function LocationDetail() {
  const { slug } = useParams()
  const location = getLocationBySlug(slug)

  if (!location) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center md:px-8">
        <h1 className="font-heading text-3xl text-black">Location Not Found</h1>
        <p className="mt-4 text-black/60">
          We couldn't find that location. Have a look at our full list of cities instead.
        </p>
        <Button to="/locations" className="mt-8">Back to Locations</Button>
      </div>
    )
  }

  const path = `/locations/${location.slug}`
  const faqs = locationFaqs(location.name)
  const otherLocations = LOCATIONS.filter((l) => l.slug !== location.slug)

  const jsonLd = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Locations', path: '/locations' },
      { name: location.name, path },
    ]),
    serviceJsonLd({
      name: `Chauffeur Service in ${location.name}`,
      description: location.tagline,
      path,
    }),
    faqJsonLd(faqs),
  ]

  return (
    <div>
      <PageMeta
        title={`${location.name} Chauffeur Service | VVIP, Corporate & Wedding Transport`}
        description={location.tagline}
        image={location.image}
        jsonLd={jsonLd}
      />

      {/* Hero — half the viewport, same style used across the site */}
      <section className="relative flex h-[50vh] min-h-[420px] w-full items-center overflow-hidden bg-brand-black text-white">
        <img
          src={location.image}
          alt={`BlackStone Chauffeur in ${location.name}`}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <Link to="/locations" className="text-sm uppercase tracking-[0.2em] text-brand-gold hover:underline">
            ← All Locations
          </Link>
          <h1 className="mt-2 font-heading text-4xl leading-tight md:text-5xl">
            Chauffeur Service in {location.name}
          </h1>
          <p className="mt-4 max-w-2xl text-white/70">{location.tagline}</p>
        </div>
      </section>

      {/* Intro + highlights */}
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:grid-cols-2 md:px-8">
          <div>
            {location.intro.map((p, i) => (
              <p key={i} className="mt-4 text-black/70 first:mt-0">{p}</p>
            ))}
            <Button to={`/booking?pickup=${encodeURIComponent(`${location.name}, New Zealand`)}`} className="mt-8">
              Book in {location.name}
            </Button>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">What We Offer in {location.name}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {location.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-black/80">
                  <CheckCircle size={18} className="mt-0.5 shrink-0 text-brand-gold" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-black/[0.02] py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">FAQ</p>
          <h2 className="mt-2 font-heading text-3xl text-black">Questions About {location.name}</h2>
          <div className="mt-6">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-xl px-4 md:px-8">
          <h2 className="font-heading text-2xl text-black">Enquire About {location.name}</h2>
          <div className="mt-4">
            <EnquiryForm type="location-enquiry" />
          </div>
        </div>
      </section>

      {/* Other locations — internal linking */}
      <section className="bg-black/[0.02] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="font-heading text-2xl text-black">Other Locations We Serve</h2>
          <div className="mt-6 flex flex-wrap gap-x-2 gap-y-2 text-sm">
            {otherLocations.map((l, i) => (
              <span key={l.slug}>
                <Link to={`/locations/${l.slug}`} className="text-brand-gold hover:underline">
                  {l.name}
                </Link>
                {i < otherLocations.length - 1 ? <span className="text-black/30"> · </span> : null}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
