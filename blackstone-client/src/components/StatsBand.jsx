export default function StatsBand({ eyebrow, heading, description, stats, dark = true, compact = false }) {
  const hasText = Boolean(heading || description || eyebrow)

  return (
    <section className={dark ? 'bg-brand-black text-white' : 'bg-white text-black'}>
      <div className={`mx-auto max-w-7xl px-4 md:px-8 ${compact ? 'py-10' : 'py-16'}`}>
        <div className={hasText ? 'grid gap-10 md:grid-cols-2 md:items-center' : ''}>
          {hasText && (
            <div>
              {eyebrow && (
                <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">{eyebrow}</p>
              )}
              {heading && (
                <h2 className="mt-2 font-heading text-3xl md:text-4xl">{heading}</h2>
              )}
              {description &&
                (Array.isArray(description) ? description : [description]).map((p, i) => (
                  <p key={i} className={`mt-4 max-w-lg ${dark ? 'text-white/70' : 'text-black/60'}`}>
                    {p}
                  </p>
                ))}
            </div>
          )}

          <div className={`grid grid-cols-3 gap-6 text-center md:gap-10 ${hasText ? '' : 'mx-auto max-w-2xl'}`}>
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-heading text-4xl text-brand-gold md:text-5xl">{s.value}</p>
                <p className={`mt-2 text-xs uppercase tracking-widest ${dark ? 'text-white/50' : 'text-black/50'}`}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
