import PageMeta from '../components/PageMeta'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <PageMeta title="Page Not Found" description="404 — Page Not Found — BlackStone Chauffeur." />
      <h1 className="font-heading text-3xl text-brand-black">404 — Page Not Found</h1>
      <p className="mt-4 text-brand-black/60">Content coming in Phase 5.</p>
    </div>
  )
}
