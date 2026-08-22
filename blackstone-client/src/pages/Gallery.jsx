import { useState } from 'react'
import { Expand } from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import PageMeta from '../components/PageMeta'
import Reveal from '../components/Reveal'
import { IMAGES } from '../constants/images'
import { breadcrumbJsonLd } from '../constants/seo'

const GALLERY_JSON_LD = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Gallery', path: '/gallery' },
])

const images = IMAGES.gallery.map((src, i) => ({
  src,
  alt: `BlackStone Chauffeur gallery image ${i + 1}`,
}))

export default function Gallery() {
  const [index, setIndex] = useState(-1)

  return (
    <div>
      <PageMeta
        title="Gallery | Our Fleet & Events"
        description="A look at BlackStone Chauffeur's fleet, chauffeurs, and events across New Zealand."
        jsonLd={GALLERY_JSON_LD}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Moments On The Road</p>
          <h1 className="mt-2 font-heading text-4xl text-brand-black">Gallery</h1>
          <p className="mt-4 max-w-2xl text-brand-black/60">
            A look at our fleet, weddings, and airport &amp; hotel arrivals.
          </p>
        </Reveal>

        {/* Masonry-style layout via CSS columns — photos keep their natural
            aspect ratio instead of being forced into uniform square crops,
            for a more editorial, modern feel. */}
        <div className="mt-10 columns-2 gap-4 sm:columns-3 md:columns-4">
          {images.map((img, i) => (
            <Reveal key={img.src} delay={(i % 4) * 80}>
              <button
                onClick={() => setIndex(i)}
                className="group relative mb-4 block w-full overflow-hidden rounded-2xl break-inside-avoid"
                aria-label={`Open image ${i + 1}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-brand-black">
                    <Expand size={18} />
                  </span>
                </div>
              </button>
            </Reveal>
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
