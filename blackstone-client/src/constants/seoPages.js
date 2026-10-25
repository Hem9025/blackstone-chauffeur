// Page-level SEO metadata for the build-time step (scripts/seoPrerender.js),
// which bakes a real <title>, meta description, canonical link and a short
// <h1>/intro into each page's static HTML. Without this, every URL's raw HTML
// is identical ("BlackStone Chauffeur", no description, no heading), which is
// all Google's first-pass crawl and most AI crawlers ever see — they don't
// all run JavaScript.
//
// The text here mirrors the <PageMeta> in each page component. When you
// change a page's title/description in its component, change it here too
// (the browser still shows the component's version once the app loads;
// this file only controls what's in the raw HTML).
//
// Detail pages (services, locations, fleet, tours, blog posts) are generated
// from their own data in scripts/seoPrerender.js — only the fixed pages live here.

export const STATIC_PAGES = [
  {
    path: '/',
    title: 'Auckland VVIP & Corporate Chauffeur',
    description:
      'VVIP, corporate and airport chauffeur service in Auckland and across NZ, plus wedding cars and private tours. Book online with upfront pricing.',
    h1: 'VVIP & Corporate Chauffeur Service in Auckland & New Zealand',
    priority: '1.0',
  },
  {
    path: '/services',
    title: 'VVIP & Corporate Chauffeur Services | Auckland & NZ',
    description:
      'Corporate travel, VIP airport transfers and international travel partnerships — plus wedding cars and city tours — professionally chauffeured across Auckland and New Zealand with upfront pricing.',
    h1: 'Chauffeur Services',
    priority: '0.9',
  },
  {
    path: '/booking',
    title: 'Book a Chauffeur Online',
    description:
      'Book your BlackStone Chauffeur ride online in minutes — corporate travel, VIP airport transfers, weddings and hourly hire, with transparent pricing confirmed before you pay.',
    h1: 'Book a Chauffeur Online',
    priority: '0.9',
  },
  {
    path: '/locations',
    title: 'Locations We Serve | Auckland & NZ',
    description:
      'VVIP, corporate and wedding chauffeur service across Auckland, Wellington, Hamilton, Rotorua, Christchurch, Napier, Taupō and Queenstown.',
    h1: 'Locations We Serve',
    priority: '0.8',
  },
  {
    path: '/tour',
    title: 'Private Chauffeured Day Tours NZ',
    description:
      'Private chauffeured day tours across New Zealand — Rotorua, Waitomo, Bay of Islands, Queenstown, Milford Sound and more, with a knowledgeable local driver.',
    h1: 'Private Chauffeured Day Tours',
    priority: '0.7',
  },
  {
    path: '/blog',
    title: 'Blog',
    description:
      'Guides, city tips and news from BlackStone Chauffeur — airport transfers, weddings, corporate travel and touring New Zealand.',
    h1: 'BlackStone Chauffeur Blog',
    priority: '0.7',
  },
  {
    path: '/about',
    title: 'About Our VVIP & Corporate Chauffeur Service',
    description:
      "New Zealand's trusted VVIP, corporate and international travel partner — serving Auckland, Wellington, Hamilton, Rotorua, Christchurch and Queenstown for 5+ years with professional chauffeurs, a premium fleet, and 24/7 availability.",
    h1: 'About BlackStone Chauffeur',
    priority: '0.5',
  },
  {
    path: '/contact',
    title: 'Contact & Book a Chauffeur',
    description:
      'Get in touch with BlackStone Chauffeur for bookings and enquiries — call, email or message us. 24/7 availability across Auckland and New Zealand.',
    h1: 'Contact BlackStone Chauffeur',
    priority: '0.5',
  },
  {
    path: '/gallery',
    title: 'Gallery | Our Fleet & Events',
    description:
      "A look at BlackStone Chauffeur's luxury fleet, professional chauffeurs, and events across Auckland and New Zealand.",
    h1: 'Gallery',
    priority: '0.4',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description:
      "Blackstone Chauffeur Ltd's Privacy Policy — how we collect, use, disclose, store and protect your personal information.",
    h1: 'Privacy Policy',
    priority: '0.2',
  },
  {
    path: '/terms',
    title: 'Terms and Conditions of Service',
    description:
      'Terms and Conditions applying to all bookings and transportation services provided by Blackstone Chauffeur Ltd.',
    h1: 'Terms & Conditions',
    priority: '0.2',
  },
]
