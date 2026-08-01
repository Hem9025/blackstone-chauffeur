import { Star } from 'lucide-react'

export default function TestimonialCard({ name, role, quote, avatar }) {
  return (
    <div className="flex h-full flex-col border border-brand-black/10 bg-white p-6">
      <div className="flex gap-1 text-brand-gold">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <p className="mt-4 flex-1 text-sm text-brand-black/70">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6 flex items-center gap-3">
        <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="text-sm font-medium text-brand-black">{name}</p>
          <p className="text-xs text-brand-black/50">{role}</p>
        </div>
      </div>
    </div>
  )
}
