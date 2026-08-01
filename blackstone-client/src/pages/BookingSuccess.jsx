import PageMeta from '../components/PageMeta'
import Button from '../components/Button'

export default function BookingSuccess() {
  return (
    <div>
      <PageMeta title="Booking Confirmed" description="Your BlackStone Chauffeur booking is confirmed." />

      <section className="mx-auto max-w-xl px-4 py-24 text-center md:px-8">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">Booking Confirmed</p>
        <h1 className="mt-2 font-heading text-4xl text-brand-black">You're all set.</h1>
        <p className="mt-4 text-brand-black/60">
          A confirmation email is on its way with your ride details. Your chauffeur
          will be assigned shortly before your pickup time.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button to="/dashboard">View My Bookings</Button>
          <Button to="/" variant="secondary">Back to Home</Button>
        </div>
      </section>
    </div>
  )
}
