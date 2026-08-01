export default function ItineraryTimeline({ eyebrow = 'Itinerary Suggestion', title, stops, note, dark = false }) {
  const headingColor = dark ? 'text-white' : 'text-black'
  const lineColor = dark ? 'border-white/20' : 'border-black/20'
  const timeColor = dark ? 'text-white/40' : 'text-black/40'
  const descColor = dark ? 'text-white/60' : 'text-black/60'
  const noteColor = dark ? 'text-white/40' : 'text-black/40'

  return (
    <div>
      {eyebrow && (
        <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">{eyebrow}</p>
      )}
      {title && <h2 className={`mt-2 font-heading text-3xl ${headingColor}`}>{title}</h2>}

      <ol className={`relative mt-8 flex flex-col gap-8 border-l border-dashed pl-8 ${lineColor}`}>
        {stops.map((stop) => (
          <li key={`${stop.time}-${stop.title}`} className="relative">
            <span className="absolute -left-[calc(2rem+5px)] top-1 h-2.5 w-2.5 rounded-full bg-brand-gold" />
            <p className={`text-xs font-medium uppercase tracking-widest ${timeColor}`}>{stop.time}</p>
            <h3 className={`mt-1 font-heading text-lg ${headingColor}`}>{stop.title}</h3>
            <p className={`mt-1 text-sm ${descColor}`}>{stop.desc}</p>
          </li>
        ))}
      </ol>

      {note && <p className={`mt-6 text-xs italic ${noteColor}`}>{note}</p>}
    </div>
  )
}
