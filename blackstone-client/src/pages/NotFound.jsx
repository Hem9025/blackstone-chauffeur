import PageMeta from '../components/PageMeta'
import Button from '../components/Button'

export default function NotFound() {
  return (
    <div>
      <PageMeta title="Page Not Found" description="The page you're looking for doesn't exist." />

      <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center md:px-8">
        <p className="font-heading text-6xl text-brand-gold">404</p>
        <h1 className="mt-4 font-heading text-2xl text-brand-black">Page not found</h1>
        <p className="mt-2 text-brand-black/60">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Button to="/" className="mt-8">Back to Home</Button>
      </section>
    </div>
  )
}
