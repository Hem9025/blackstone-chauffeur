// Homepage text that is also written into the page's raw HTML at build time
// (scripts/seoPrerender.js), so search engines and AI tools that don't run
// JavaScript can read it. Home.jsx imports the same data — edit it here and
// both the live page and the static HTML stay in step.

export const HOME_FAQS = [
  { question: 'How far in advance should I book?', answer: 'We recommend booking at least 3 days ahead, though we do our best to accommodate last-minute requests.' },
  { question: 'Do you provide airport meet & greet?', answer: 'Yes — our chauffeurs track your flight and will be waiting in the arrivals hall with a name board.' },
  { question: 'Can I add extras to my booking?', answer: 'Absolutely. Child seats, extra wait time, VIP airport pickup and more can be added when selecting your vehicle.' },
  { question: 'What payment methods do you accept?', answer: 'All major credit and debit cards via our secure Stripe checkout.' },
]

export const HOME_SERVICES = [
  { title: 'Corporate Travel', desc: 'Discreet, reliable chauffeur service for executives, VVIP guests and international travel partners.' },
  { title: 'Airport Transfers', desc: 'Punctual VIP meet & greet transfers to and from every major terminal.' },
  { title: 'Weddings & Events', desc: 'Arrive in style on the most important days.' },
  { title: 'Private Tours', desc: 'Bespoke sightseeing with a professional local driver.' },
]

export const HOME_INTRO = [
  'BlackStone Chauffeur is an Auckland chauffeur service for VVIP guests, corporate executives and international visitors. For over 5 years we have provided airport transfers, corporate travel, wedding cars and private day tours with professional drivers and a premium fleet.',
]

// Longer "about the service" block shown on the homepage (and in the static
// HTML). Plain statements only — nothing here that the site doesn't already say.
export const HOME_SEO_TEXT = {
  heading: 'Auckland’s Chauffeur Service for Airport Transfers, Corporate Travel and Weddings',
  paragraphs: [
    'BlackStone Chauffeur provides VVIP, corporate and airport chauffeur transport across Auckland and New Zealand. Every booking is driven by a licensed, professional chauffeur in a clean, well-maintained vehicle, with your total price confirmed before you book.',
    'Our airport transfers include meet and greet: your chauffeur tracks your flight and waits in the arrivals hall, so a delayed flight never leaves you stranded. For business travel we look after executives, VVIP guests and international travel partners with discreet, punctual service.',
    'Planning a wedding or a special night out? Arrive in style in a luxury sedan, SUV or van, with a chauffeur who puts your schedule first. We also run private chauffeured day tours, from city sightseeing to Rotorua, Waitomo, Queenstown and beyond.',
    'We serve Auckland, Wellington, Hamilton, Rotorua, Christchurch, Napier, Taupō and Queenstown. Book online in minutes, or contact us to plan a longer trip.',
  ],
}
