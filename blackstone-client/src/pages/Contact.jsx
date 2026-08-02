import { Phone, Mail, Clock } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import EnquiryForm from '../components/EnquiryForm'
import { IMAGES } from '../constants/images'

export default function Contact() {
  return (
    <div>
      <PageMeta
        title="Contact"
        description="Get in touch with BlackStone Chauffeur for bookings and enquiries."
      />

      <section className="relative overflow-hidden bg-brand-black text-brand-white">
        <img src={IMAGES.heroAlt} alt="Contact BlackStone Chauffeur" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/70 via-brand-black/45 to-brand-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-8">
          <h1 className="font-heading text-4xl">Contact Us</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-xl text-brand-black">Get in Touch</h2>
            <div className="mt-4 space-y-3 text-sm text-brand-black/70">
              <a href="tel:+64204525000" className="flex items-center gap-2 hover:text-brand-gold"><Phone size={16} className="text-brand-gold" /> +64 20 452 5000</a>
              <a href="mailto:info@blackstonechauffeur.co.nz" className="flex items-center gap-2 hover:text-brand-gold"><Mail size={16} className="text-brand-gold" /> info@blackstonechauffeur.co.nz</a>
              <p className="flex items-center gap-2"><Clock size={16} className="text-brand-gold" /> 24/7 booking availability</p>
            </div>

            <div className="mt-8 aspect-video w-full overflow-hidden border border-brand-black/10">
              <iframe
                title="BlackStone Chauffeur location"
                src="https://www.google.com/maps?q=New+Zealand&output=embed"
                className="h-full w-full border-0"
                loading="lazy"
              />
            </div>
          </div>

          <div>
            <h2 className="font-heading text-xl text-brand-black">Send an Enquiry</h2>
            <div className="mt-4">
              <EnquiryForm type="contact" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
