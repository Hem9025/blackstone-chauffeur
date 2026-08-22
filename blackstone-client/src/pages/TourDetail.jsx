import { useParams, Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import ItineraryTimeline from '../components/ItineraryTimeline'
import { getTourBySlug } from '../constants/tours'
import { breadcrumbJsonLd, touristTripJsonLd } from '../constants/seo'

export default function TourDetail() {
  const { slug } = useParams()
  const tour = getTourBySlug(slug)

  if (!tour) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center md:px-8">
        <h1 className="font-heading text-3xl text-black">Tour Not Found</h1>
        <p className="mt-4 text-black/60">
          We couldn't find that tour. Have a look at our full list of tours instead.
        </p>
        <Button to="/tour" className="mt-8">Back to Tours</Button>
      </div>
    )
  }

  const path = `/tour/${tour.slug}`
  const jsonLd = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Tours', path: '/tour' },
      { name: tour.title, path },
    ]),
    touristTripJsonLd({
      name: tour.title,
      description: tour.shortDesc,
      path,
      image: tour.heroImage,
      itinerary: tour.itinerary,
    }),
  ]

  return (
    <div>
      <PageMeta title={`${tour.title} | Private Chauffeured Day Tour`} description={tour.shortDesc} image={tour.heroImage} jsonLd={jsonLd} />

      {/* Hero — half the viewport, same style used across the site */}
      <section className="relative flex h-[50vh] min-h-[420px] w-full items-center overflow-hidden bg-brand-black text-white">
        <img
          src={tour.heroImage}
          alt={tour.title}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <Link to="/tour" className="text-sm uppercase tracking-[0.2em] text-brand-gold hover:underline">
            ← All Tours
          </Link>
          <h1 className="mt-2 font-heading text-4xl leading-tight md:text-5xl">{tour.title}</h1>
          <p className="mt-4 max-w-2xl text-white/70">{tour.shortDesc}</p>
        </div>
      </section>

      {/* Gallery + itinerary, side by side */}
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:grid-cols-2 md:px-8">
          {/* Places you'll visit — photo gallery with captions */}
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Places You'll Visit</p>
            <h2 className="mt-2 font-heading text-2xl text-black">{tour.title} Gallery</h2>
            <div className="mt-6 flex flex-col gap-8">
              {tour.gallery.map((place) => (
                <figure key={place.title}>
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={place.src}
                      alt={place.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <figcaption className="mt-3">
                    <p className="font-heading text-lg text-black">{place.title}</p>
                    <p className="mt-1 text-sm text-black/60">{place.desc}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* Itinerary timeline */}
          <div>
            <ItineraryTimeline
              eyebrow="Itinerary Suggestion"
              title="A Day to Remember"
              stops={tour.itinerary}
              note="*Itinerary is flexible and can be customised to your preferences."
            />
            <Button to="/contact" className="mt-8">Enquire Now</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
