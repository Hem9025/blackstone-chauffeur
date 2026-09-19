import { IMAGES } from './images'

// Individual location landing pages (see pages/LocationDetail.jsx) — one per
// city in CITIES_SERVED (constants/seo.js). Keep this list and that one in
// sync if the operating area changes.
//
// The booking CTA on each page links to /booking with a prefilled pickup
// address (the same ?pickup= query param the homepage Quick Book widget
// uses) rather than claiming instant online pricing everywhere — Booking.jsx
// already runs its own service-radius check (utils/bookingRules.js) and
// quietly routes anything outside Auckland's instant-booking radius to a
// custom-quote enquiry instead, so this page doesn't need to duplicate that
// logic or guess which cities are "instant book" vs "enquire."
export const LOCATIONS = [
  {
    slug: 'auckland',
    name: 'Auckland',
    image: IMAGES.places.skyTower,
    tagline: 'VIP airport transfers, corporate travel and wedding car hire in Auckland.',
    intro: [
      "Auckland is home base for BlackStone Chauffeur — our fleet, our chauffeurs, and the vast majority of the rides we run every week.",
      "From VIP meet-and-greet at Auckland Airport to executive travel around the CBD and wedding car hire across the region, Auckland is where we're fastest, most flexible, and best placed to look after VVIP guests, corporate travel partners and international visitors the moment they land.",
    ],
    highlights: [
      'VIP Auckland Airport meet & greet',
      'Corporate travel for CBD executives and business events',
      'Wedding car hire across greater Auckland',
      'Private tours to Waiheke Island, Piha and the Waitakere Ranges',
    ],
  },
  {
    slug: 'wellington',
    name: 'Wellington',
    image: IMAGES.places.milfordSoundAlt,
    tagline: 'Chauffeured travel for government, corporate and diplomatic guests in the capital.',
    intro: [
      "As New Zealand's capital, Wellington sees a steady flow of government delegations, corporate executives and international visitors who need transport that's punctual, discreet and presentable.",
      'BlackStone Chauffeur arranges VIP airport transfers, executive travel and wedding car hire in Wellington, coordinated the same way as every other city we serve — book online or send us your details and we\'ll confirm a price and chauffeur before your trip.',
    ],
    highlights: [
      'VIP Wellington Airport transfers',
      'Corporate and government travel',
      'Wedding car hire',
      'Point-to-point transfers around the CBD and Hutt Valley',
    ],
  },
  {
    slug: 'hamilton',
    name: 'Hamilton',
    image: IMAGES.places.waitomoCaves,
    tagline: 'Waikato business travel, wedding transport and Hobbiton tour transfers.',
    intro: [
      "Hamilton and the wider Waikato region combine a growing business community with some of the North Island's best-known tourist drawcards, including Hobbiton and the Waitomo Caves.",
      'BlackStone Chauffeur covers corporate travel between Auckland and Hamilton, wedding car hire for Waikato venues, and private transfers for visitors touring the region.',
    ],
    highlights: [
      'Corporate travel between Auckland and Hamilton',
      'Wedding car hire for Waikato venues',
      'Private transfers to Hobbiton and Waitomo Caves',
      'Airport transfers to and from Auckland Airport',
    ],
  },
  {
    slug: 'rotorua',
    name: 'Rotorua',
    image: IMAGES.places.rotoruaGeothermal,
    tagline: 'VIP transfers for geothermal parks, business events and weddings in Rotorua.',
    intro: [
      "Rotorua's geothermal parks, cultural experiences and conference venues draw a steady mix of international visitors and corporate groups.",
      "BlackStone Chauffeur provides VIP transfers to Rotorua's geothermal parks and attractions, corporate travel for business events, and wedding car hire for the region's popular venues.",
    ],
    highlights: [
      'VIP transfers to geothermal parks and cultural attractions',
      'Corporate travel for business events and conferences',
      'Wedding car hire',
      'Airport transfers to and from Rotorua Airport',
    ],
  },
  {
    slug: 'christchurch',
    name: 'Christchurch',
    image: IMAGES.places.christchurch,
    tagline: "Chauffeured travel through the South Island's main gateway city.",
    intro: [
      "Christchurch is the main gateway to the South Island, making it a regular stop for international travel partners and corporate groups heading further south.",
      'BlackStone Chauffeur arranges VIP airport transfers, corporate travel and wedding car hire in Christchurch, with the same upfront pricing and professional standard as every city we serve.',
    ],
    highlights: [
      'VIP Christchurch Airport transfers',
      'Corporate travel for business visitors',
      'Wedding car hire',
      'Private tours and point-to-point transfers',
    ],
  },
  {
    slug: 'napier',
    name: 'Napier',
    image: IMAGES.places.pihaBeachAlt,
    tagline: "Wine trail transfers and wedding car hire in Hawke's Bay.",
    intro: [
      "Napier and the Hawke's Bay wine region are a popular destination for private tours, corporate retreats and weddings.",
      'BlackStone Chauffeur provides wine trail transfers, corporate travel and wedding car hire in Napier, so guests can enjoy the region without anyone needing to drive.',
    ],
    highlights: [
      "Hawke's Bay wine trail transfers",
      'Corporate travel and retreats',
      'Wedding car hire',
      'Airport transfers to and from Hawke\'s Bay Airport',
    ],
  },
  {
    slug: 'taupo',
    name: 'Taupō',
    image: IMAGES.places.bayOfIslands,
    tagline: 'Lake and Tongariro tour transfers, plus corporate and wedding travel.',
    intro: [
      'Taupō is a natural stop for visitors exploring the central North Island, from Lake Taupō itself to the Tongariro region nearby.',
      'BlackStone Chauffeur provides private tour transfers, corporate travel and wedding car hire in Taupō, for guests who want the scenery without the driving.',
    ],
    highlights: [
      'Lake Taupō and Tongariro tour transfers',
      'Corporate travel',
      'Wedding car hire',
      'Point-to-point transfers around the region',
    ],
  },
  {
    slug: 'queenstown',
    name: 'Queenstown',
    image: IMAGES.places.queenstown,
    tagline: 'VIP transfers for ski season, tourism and weddings in Queenstown.',
    intro: [
      "Queenstown is one of New Zealand's busiest destinations for international visitors, from ski season through to Milford Sound day trips and destination weddings.",
      'BlackStone Chauffeur provides VIP airport transfers, private tour transfers and wedding car hire in Queenstown, for guests who expect the same standard of service they\'d get anywhere else in the world.',
    ],
    highlights: [
      'VIP Queenstown Airport transfers',
      'Private tour transfers, including Milford Sound day trips',
      'Wedding car hire',
      'Ski season transfers',
    ],
  },
]

export function getLocationBySlug(slug) {
  return LOCATIONS.find((l) => l.slug === slug)
}

// Shared FAQ copy, lightly parameterised with the city name — used on every
// location page rather than writing near-identical FAQs eight times over.
export function locationFaqs(cityName) {
  return [
    {
      question: `How far in advance should I book a chauffeur in ${cityName}?`,
      answer: 'We recommend booking at least 3 days ahead. Need something sooner? Call or WhatsApp us directly and we\'ll do our best to accommodate short-notice requests.',
    },
    {
      question: `Is instant online pricing available in ${cityName}?`,
      answer: "Auckland bookings are usually priced and confirmed instantly online. For other cities, our booking page will route your request to a quick custom quote instead — the pricing and booking process is otherwise identical.",
    },
    {
      question: `What vehicles are available in ${cityName}?`,
      answer: 'Our full luxury and comfort-class fleet — sedans, SUVs and vans — is available for bookings across every city we serve, based on your party size and preferences.',
    },
  ]
}
