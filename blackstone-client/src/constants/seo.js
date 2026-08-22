// Shared SEO building blocks — structured data (JSON-LD "rich results"
// markup) and the one set of business facts (name/phone/email/cities
// served) every page's schema pulls from. Keeping this in one file means
// the business's name/contact/service-area info is defined exactly once
// and can't drift out of sync between pages the way copy-pasted JSON-LD
// blocks eventually would.
//
// Background: the SEO plan (blackstone-chauffeur-seo-plan.md) flagged that
// the site "can support rich results... but it isn't turned on yet for the
// key pages" — this file plus the jsonLd prop on <PageMeta> is that fix.

export const SITE_URL = 'https://www.blackstonechauffeur.co.nz'
export const BUSINESS_NAME = 'BlackStone Chauffeur'
export const BUSINESS_PHONE = '+64-20-452-5000'
export const BUSINESS_EMAIL = 'info@blackstonechauffeur.co.nz'

// Real, live social profiles — mirrored in Footer.jsx's social icon row.
// No X/Twitter account exists yet, so it's intentionally omitted rather
// than linking a placeholder '#'.
export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=61578486482910',
  instagram: 'https://www.instagram.com/blackstonechauffeur.nz/',
}

// Same Place ID the server's /api/reviews endpoint uses (see
// blackstone-server/.env.example) to pull real Google reviews. The
// "write a review" link works with just the Place ID — no API key
// needed — so it can go live immediately, independent of whether
// GOOGLE_PLACES_API_KEY has been configured yet.
export const GOOGLE_PLACE_ID = 'ChIJ89UghFtCzAARBXj36cQzsYA'
export const GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`

// Mirrors Footer.jsx's CITIES_WE_SERVE and About.jsx's "Where We Operate"
// section — update all three together if the operating area changes.
export const CITIES_SERVED = [
  'Auckland', 'Hamilton', 'Rotorua', 'Christchurch', 'Wellington', 'Napier', 'Taupō', 'Queenstown',
]

const areaServed = CITIES_SERVED.map((name) => ({ '@type': 'City', name }))

// The core LocalBusiness entity — reused (not duplicated) across Home,
// About, and Contact, since it's the same real-world business either way.
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#organization`,
  name: BUSINESS_NAME,
  description:
    'Premium chauffeur service offering airport transfers, corporate travel, weddings and private tours across New Zealand.',
  url: SITE_URL,
  telephone: BUSINESS_PHONE,
  email: BUSINESS_EMAIL,
  image: `${SITE_URL}/images/brand/logo.png`,
  priceRange: '$$$',
  address: { '@type': 'PostalAddress', addressCountry: 'NZ' },
  // Real, live profiles only (see SOCIAL_LINKS) — no X/Twitter entry since
  // that account doesn't exist yet.
  sameAs: [SOCIAL_LINKS.facebook, SOCIAL_LINKS.instagram],
  areaServed,
  // Matches the "24/7 booking availability" line shown on the Contact page.
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '00:00',
    closes: '23:59',
  },
}

// items: [{ name, path }] in order from the homepage down to the current
// page — e.g. [{name:'Home',path:'/'}, {name:'Fleet',path:'/fleet/luxury'}].
export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

// faqs: [{ question, answer }] — lets an FAQ section become an actual
// expandable FAQ rich result directly in Google's search listing.
export function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

// A chauffeured service offering (airport transfers, a specific vehicle
// class, hourly hire, etc.) — NOT a Product/Vehicle schema, since the
// customer is booking a ride, not buying the car itself.
export function serviceJsonLd({ name, description, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: name,
    name,
    description,
    provider: { '@type': 'LocalBusiness', name: BUSINESS_NAME, url: SITE_URL, telephone: BUSINESS_PHONE },
    areaServed,
    ...(path ? { url: `${SITE_URL}${path}` } : {}),
  }
}

// A guided day tour — schema.org's TouristTrip type, which is built
// specifically for this (an itinerary of places, run by a named provider).
export function touristTripJsonLd({ name, description, path, image, itinerary = [] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name,
    description,
    ...(image ? { image } : {}),
    ...(path ? { url: `${SITE_URL}${path}` } : {}),
    provider: { '@type': 'LocalBusiness', name: BUSINESS_NAME, url: SITE_URL, telephone: BUSINESS_PHONE },
    // Itinerary stops come from constants/tours.js as { time, title, desc }
    // objects — 'title' is the stop's name there, not 'name'.
    itinerary: itinerary.map((stop, i) => ({
      '@type': 'Place',
      name: typeof stop === 'string' ? stop : stop.title || stop.name,
      position: i + 1,
    })),
  }
}
