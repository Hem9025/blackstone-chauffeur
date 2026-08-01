import PageMeta from './PageMeta'

// Shared layout for long-form legal documents (Privacy Policy, Terms &
// Conditions). `sections` is an array of:
//   { heading: string, blocks: Array<
//       { type: 'p', text: string }
//     | { type: 'h3', text: string }
//     | { type: 'ul', items: string[] }
//   > }
export default function LegalPageLayout({ title, effectiveDate, intro, sections, description }) {
  return (
    <div className="bg-white">
      <PageMeta title={title} description={description} />

      <section className="border-b border-black/10 bg-brand-black py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <h1 className="font-heading text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-white/50">Effective Date: {effectiveDate}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 md:px-8">
        {intro && (
          <div className="mb-10 flex flex-col gap-4 text-sm leading-relaxed text-black/70">
            {intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-12">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="font-heading text-xl text-black">
                {i + 1}. {section.heading}
              </h2>
              <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-black/70">
                {section.blocks.map((block, j) => {
                  if (block.type === 'h3') {
                    return (
                      <h3 key={j} className="mt-2 text-base font-medium text-black">
                        {block.text}
                      </h3>
                    )
                  }
                  if (block.type === 'ul') {
                    return (
                      <ul key={j} className="ml-5 list-disc space-y-1.5">
                        {block.items.map((item, k) => (
                          <li key={k}>{item}</li>
                        ))}
                      </ul>
                    )
                  }
                  return <p key={j}>{block.text}</p>
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
