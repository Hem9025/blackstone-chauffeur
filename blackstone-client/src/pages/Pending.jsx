import PageMeta from '../components/PageMeta'
import Button from '../components/Button'

export default function Pending() {
  return (
    <div>
      <PageMeta title="Application Pending" description="Your driver application is under review." />

      <section className="mx-auto max-w-xl px-4 py-24 text-center md:px-8">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">Application Received</p>
        <h1 className="mt-2 font-heading text-4xl text-brand-black">Thanks for applying.</h1>
        <p className="mt-4 text-brand-black/60">
          Our team is reviewing your driver application. You'll receive an email with
          a login link as soon as your account is approved.
        </p>
        <Button to="/" variant="secondary" className="mt-8">
          Back to Home
        </Button>
      </section>
    </div>
  )
}
