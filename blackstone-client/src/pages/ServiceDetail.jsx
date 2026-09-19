import { useParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import FaqAccordion from '../components/FaqAccordion'
import EnquiryForm from '../components/EnquiryForm'
import { SERVICE_PAGES, getServicePageBySlug, serviceFaqs } from '../constants/servicePages'
import { breadcrumbJsonLd, serviceJsonLd, faqJsonLd } from '../constants/seo'

export default function ServiceDetail() {
  const { slug } = useParams()
  const service = getServicePageBySlug(slug)

  if (!service) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center md:px-8">
        <h1 className="font-heading text-3xl text-black">Service Not Found</h1>
        <p className="mt-4 text-black/60">
          We couldn't find that service. Have a look at our full list of services instead.
        </p>
        <Button to="/services" className="mt-8">Back to Services</Button>
      </div>
    )
  }

  const path = `/services/${service.slug}`
  const faqs = serviceFaqs(service.title)
  const otherServices = SERVICE_PAGES.filter((s) => s.slug !== service.slug)

  const jsonLd = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Services', path: '/services' },
      { name: service.title, path },
    ]),
    serviceJsonLd({
      name: service.title,
      description: service.tagline,
      path,
    }),
    faqJsonLd(faqs),
  ]

  return (
    <div>
      <PageMeta
        title={`${service.title} | Auckland & NZ`}
        description={service.tagline}
        image={service.image}
        jsonLd={jsonLd}
      />

      {/* Hero — half the viewport, same style used across the site */}
      <section className="relative flex h-[50vh] min-h-[420px] w-full items-center overflow-hidden bg-brand-black text-white">
        <img
          src={service.image}
          alt={service.title}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <Link to="/services" className="text-sm uppercase tracking-[0.2em] text-brand-gold hover:underline">
            ← All Services
          </Link>
          <h1 className="mt-2 font-heading text-4xl leading-tight md:text-5xl">{service.title}</h1>
          <p className="mt-4 max-w-2xl text-white/70">{service.tagline}</p>
        </div>
      </section>

      {/* Intro + highlights */}
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:grid-cols-2 md:px-8">
          <div>
            {service.intro.map((p, i) => (
              <p key={i} className="mt-4 text-black/70 first:mt-0">{p}</p>
            ))}
            <Button to="/booking" className="mt-8">Book Now</Button>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">What's Included</p>
            <ul className="mt-4 flex flex-col gap-3">
              {service.highlights.map((h) => (
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
          <h2 className="mt-2 font-heading text-3xl text-black">Questions About {service.title}</h2>
          <div className="mt-6">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-xl px-4 md:px-8">
          <h2 className="font-heading text-2xl text-black">Enquire About {service.title}</h2>
          <div className="mt-4">
            <EnquiryForm type="service-enquiry" />
          </div>
        </div>
      </section>

      {/* Other services — internal linking */}
      <section className="bg-black/[0.02] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="font-heading text-2xl text-black">Other Services</h2>
          <div className="mt-6 flex flex-wrap gap-x-2 gap-y-2 text-sm">
            {otherServices.map((s, i) => (
              <span key={s.slug}>
                <Link to={`/services/${s.slug}`} className="text-brand-gold hover:underline">
                  {s.title}
                </Link>
                {i < otherServices.length - 1 ? <span className="text-black/30"> · </span> : null}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
