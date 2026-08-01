import PageMeta from '../components/PageMeta'
import EnquiryForm from '../components/EnquiryForm'
import TourCard from '../components/TourCard'
import { IMAGES } from '../constants/images'
import { NORTH_ISLAND_TOURS, SOUTH_ISLAND_TOURS } from '../constants/tours'

export default function Tour() {
  return (
    <div>
      <PageMeta
        title="Tour"
        description="Private chauffeured tours across New Zealand's North and South Islands, with a knowledgeable local driver."
      />

      {/* Intro hero — half the viewport, same style as About/Services */}
      <section className="relative flex h-[50vh] min-h-[420px] w-full items-center overflow-hidden bg-brand-black text-white">
        <img
          src={IMAGES.services.tour}
          alt="BlackStone Chauffeur tours"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <h1 className="font-heading text-5xl leading-tight md:text-6xl">Tour Packages</h1>
        </div>
      </section>

      {/* North / South Island tour grids — 3 across */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="font-heading text-3xl text-black">North Island Tours</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {NORTH_ISLAND_TOURS.map((t) => (
              <TourCard key={t.slug} tour={t} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="font-heading text-3xl text-black">South Island Tours</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {SOUTH_ISLAND_TOURS.map((t) => (
              <TourCard key={t.slug} tour={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-xl px-4 md:px-8">
          <h2 className="font-heading text-2xl text-black">Enquire About a Tour</h2>
          <div className="mt-4">
            <EnquiryForm type="tour" />
          </div>
        </div>
      </section>
    </div>
  )
}
