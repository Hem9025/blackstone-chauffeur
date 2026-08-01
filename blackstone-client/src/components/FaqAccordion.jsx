import { useState } from 'react'

export default function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="divide-y divide-brand-black/10 border-y border-brand-black/10">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={item.question}>
            <button
              className="flex w-full items-center justify-between py-5 text-left"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="font-medium text-brand-black">{item.question}</span>
              <span className="ml-4 text-brand-gold">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <p className="pb-5 text-sm text-brand-black/60">{item.answer}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
