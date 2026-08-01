import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import PageMeta from '../components/PageMeta'
import { IMAGES } from '../constants/images'

const images = IMAGES.gallery.map((src, i) => ({
  src,
  alt: `BlackStone Chauffeur gallery image ${i + 1}`,
}))

export default function Gallery() {
  const [index, setIndex] = useState(-1)

  return (
    <div>
      <PageMeta title="Gallery" description="A look at BlackStone Chauffeur's fleet and events." />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h1 className="font-heading text-4xl text-brand-black">Gallery</h1>
        <p className="mt-4 max-w-2xl text-brand-black/60">
          A look at our fleet, weddings, and airport &amp; hotel arrivals.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, i) => (
            <button
              key={img.src}
              onClick={() => setIndex(i)}
              className="aspect-square overflow-hidden"
              aria-label={`Open image ${i + 1}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          ))}
        </div>
      </section>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={images}
      />
    </div>
  )
}
