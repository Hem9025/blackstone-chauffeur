import { Link } from 'react-router-dom'

export default function TourCard({ tour }) {
  return (
    <Link
      to={`/tour/${tour.slug}`}
      className="group flex flex-col overflow-hidden border border-black/10 bg-white"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={tour.heroImage}
          alt={tour.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg text-black">{tour.title}</h3>
        <p className="mt-1 text-sm text-black/60">{tour.shortDesc}</p>
      </div>
    </Link>
  )
}
