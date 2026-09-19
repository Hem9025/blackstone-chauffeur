import { IMAGES } from './images'

// Dedicated, deeper landing pages for our core services (see
// pages/ServiceDetail.jsx) — a level below the overview grid on the
// /services page, each with its own URL, copy and FAQ for SEO. Kept to a
// short list of the services worth a standalone page, rather than one for
// every tile in Services.jsx's overview grid.
export const SERVICE_PAGES = [
  {
    slug: 'corporate-travel',
    title: 'Corporate Travel',
    image: IMAGES.services.corporate,
    tagline: 'Discreet, reliable chauffeur service for executives, VVIP guests and international travel partners.',
    intro: [
      'BlackStone Chauffeur is the trusted corporate travel partner for executives, VVIP guests and international business visitors across New Zealand.',
      "Whether it's a single airport pickup for a visiting executive or a standing arrangement for a corporate travel partner's team, every ride is priced upfront, tracked for flight delays where relevant, and run by a professional, background-checked chauffeur.",
    ],
    highlights: [
      'Dedicated account-style booking for corporate travel partners',
      'Flight tracking and meet & greet for visiting executives',
      'Discreet, professional chauffeurs for confidential business travel',
      'Transparent, upfront pricing with no surprise fees',
    ],
  },
  {
    slug: 'vip-service',
    title: 'VIP Service',
    image: IMAGES.services.vip,
    tagline: 'Exclusive, discreet transport for VVIP guests and international travel partners.',
    intro: [
      "Our VIP service is built for guests who expect a higher standard: private, punctual, and handled with discretion from the moment they land.",
      'From VVIP airport arrivals to full-day availability, our chauffeurs are trained to anticipate what a VIP guest needs without being asked — and our fleet is presented to match.',
    ],
    highlights: [
      'Priority meet & greet for VVIP arrivals',
      'Private, discreet transport for high-profile guests',
      'Flexible, full-day or multi-day availability',
      'Premium fleet presented to VIP standard',
    ],
  },
  {
    slug: 'airport-transfers',
    title: 'Airport Transfers',
    image: IMAGES.services.airport,
    tagline: 'Punctual VIP meet & greet transfers to and from every major New Zealand terminal.',
    intro: [
      "Airport transfers are where BlackStone Chauffeur started, and it's still where we're most precise: your chauffeur tracks your flight, waits in the arrivals hall with a name board, and includes a full hour of free waiting time after landing.",
      'Available for arrivals and departures at every major terminal we serve, for solo travellers, families and corporate groups alike.',
    ],
    highlights: [
      'Live flight tracking, included as standard',
      '1 hour of free waiting time after landing',
      'Meet & greet in the arrivals hall with a name board',
      'Available for arrivals and departures, any time of day',
    ],
  },
  {
    slug: 'weddings',
    title: 'Weddings & Events',
    image: IMAGES.services.wedding,
    tagline: 'Reliable, stylish wedding car hire for the most important day.',
    intro: [
      'Your wedding day runs on a schedule that matters — BlackStone Chauffeur builds wedding car hire packages around it, not the other way around.',
      'From the bridal party arrival to the final send-off, we handle the details: presentation, punctuality and a chauffeur who understands the day is about you, not the transport.',
    ],
    highlights: [
      'Tailored wedding packages built around your schedule',
      'Immaculately presented fleet for photos and arrivals',
      'Professional, unobtrusive chauffeurs',
      'Also available for engagements, anniversaries and other special occasions',
    ],
  },
  {
    slug: 'private-tours',
    title: 'Private Tours',
    image: IMAGES.services.tour,
    tagline: 'Bespoke sightseeing across New Zealand with a knowledgeable local chauffeur.',
    intro: [
      'See more of New Zealand without anyone in your group needing to drive. Our private tours are chauffeur-led and fully flexible — from a half-day city tour to a multi-day South Island itinerary.',
      'Popular routes include Rotorua and Waitomo in the North Island, and Queenstown and Milford Sound in the South Island — see our full tour list for itineraries, or ask us to build one around your interests.',
    ],
    highlights: [
      'Flexible, chauffeur-led private tours',
      'Local knowledge from an experienced driver',
      'North and South Island itineraries available',
      'Custom itineraries built around your interests',
    ],
  },
]

export function getServicePageBySlug(slug) {
  return SERVICE_PAGES.find((s) => s.slug === slug)
}

// Shared FAQ copy, lightly parameterised with the service title.
export function serviceFaqs(title) {
  return [
    {
      question: `How do I book ${title}?`,
      answer: 'Book online in minutes with transparent, upfront pricing, or send us your details and we\'ll confirm a quote — whichever suits the trip.',
    },
    {
      question: 'How far in advance should I book?',
      answer: 'We recommend booking at least 3 days ahead. For same-day or next-day requests, call or WhatsApp us directly and we\'ll do our best to accommodate you.',
    },
    {
      question: 'Which cities is this available in?',
      answer: 'Auckland, Wellington, Hamilton, Rotorua, Christchurch, Napier, Taupō and Queenstown — see our locations page for details specific to your city.',
    },
  ]
}
