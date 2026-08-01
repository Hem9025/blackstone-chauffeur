import Button from './Button'

export default function OccasionStrip({ eyebrow, title, paragraphs, image, cta, reverse = false, dark = false }) {
  return (
    <section className={dark ? 'bg-brand-black-soft text-white' : 'bg-white text-black'}>
      <div className="mx-auto max-w-7xl md:px-8">
        <div
          className={`grid grid-cols-1 md:min-h-[520px] md:grid-cols-2 ${
            reverse ? 'md:[&>*:first-child]:order-2' : ''
          }`}
        >
          <div className="aspect-[4/3] overflow-hidden md:aspect-auto md:h-full">
            <img src={image} alt={title} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center gap-4 px-4 py-12 md:px-12 md:py-0">
            <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">{eyebrow}</p>
            <h2 className="font-heading text-3xl">{title}</h2>
            {paragraphs.map((p, i) => (
              <p key={i} className={dark ? 'text-white/70' : 'text-black/60'}>
                {p}
              </p>
            ))}
            <Button to={cta.to} className="mt-2 self-start">
              {cta.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
