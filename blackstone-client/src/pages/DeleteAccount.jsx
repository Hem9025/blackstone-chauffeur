import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'

// Public page explaining how to delete a BlackStone Chauffeur account. Google
// Play requires a web address (besides the in-app button) where people can
// request account deletion — this is it.
export default function DeleteAccount() {
  return (
    <div>
      <PageMeta
        title="Delete Your Account"
        description="How to delete your BlackStone Chauffeur account and what happens to your data."
      />
      <section className="mx-auto max-w-2xl px-4 py-16 md:px-8">
        <h1 className="font-heading text-3xl text-brand-black">Delete your account</h1>
        <p className="mt-4 text-brand-black/70">
          You can delete your BlackStone Chauffeur account at any time, in the website or in the BlackStone Chauffeur
          app.
        </p>

        <h2 className="mt-8 font-heading text-xl text-brand-black">How to delete it</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-brand-black/70">
          <li>
            <Link to="/login" className="text-brand-gold underline">Log in</Link> to your account.
          </li>
          <li>Open <Link to="/profile" className="text-brand-gold underline">My Profile</Link> (Account in the app).</li>
          <li>Scroll to <strong>Delete my account</strong>, enter your password and confirm.</li>
        </ol>
        <p className="mt-4 text-brand-black/70">
          If you can't log in, email us at{' '}
          <a href="mailto:info@blackstonechauffeur.co.nz" className="text-brand-gold underline">
            info@blackstonechauffeur.co.nz
          </a>{' '}
          from the address on your account and we will delete it for you.
        </p>

        <h2 className="mt-8 font-heading text-xl text-brand-black">What happens to your data</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-brand-black/70">
          <li>Your name, email address, phone number and login are removed, and you can no longer sign in.</li>
          <li>Your saved notification devices and in-app notifications are deleted.</li>
          <li>
            Past booking, payment and invoice records are kept for our business and tax records. They are no longer
            linked to your name or contact details.
          </li>
          <li>If you have an upcoming ride, cancel it first. An account with upcoming rides can't be deleted.</li>
        </ul>

        <p className="mt-8 text-sm text-brand-black/50">
          See our <Link to="/privacy" className="text-brand-gold underline">Privacy Policy</Link> for more on how we
          handle your information.
        </p>
      </section>
    </div>
  )
}
