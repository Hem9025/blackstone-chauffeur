import { IMAGES } from './images'

// Two alternating detail-shot sets so neighbouring vehicles in a category
// don't show the exact same four gallery photos.
const galleryA = (model) => [
  { src: IMAGES.fleetGallery.interior1, title: 'Cabin', desc: `Premium leather seating inside the ${model}, finished for long-distance comfort.` },
  { src: IMAGES.fleetGallery.dashboard1, title: 'Dashboard', desc: 'Driver console and controls, kept clean and distraction-free for a smooth ride.' },
  { src: IMAGES.fleetGallery.sunroof1, title: 'Panoramic Roof', desc: 'Open, airy cabin lighting for a more relaxed journey.' },
  { src: IMAGES.fleetGallery.trunk1, title: 'Luggage Space', desc: 'Generous boot space, sized for airport runs and multi-stop days.' },
]

// Real client-supplied interior photography for specific vehicles — paired
// titles/descriptions match what's actually in each photo (see
// IMAGES.fleetInterior). Hero images for these vehicles are untouched.
const bmw7SeriesGallery = [
  { src: IMAGES.fleetInterior.bmw7Series[0], title: 'Rear Cabin', desc: 'Executive rear seating in fine leather, built for long, relaxed journeys.' },
  { src: IMAGES.fleetInterior.bmw7Series[1], title: 'Front Cabin', desc: 'Driver console and controls, finished to the same premium standard throughout.' },
  { src: IMAGES.fleetInterior.bmw7Series[2], title: 'Panoramic Roof', desc: 'Open, airy cabin lighting for a more relaxed journey.' },
  { src: IMAGES.fleetInterior.bmw7Series[3], title: 'Dashboard', desc: 'A clean, driver-focused dashboard with the latest BMW infotainment.' },
]

const audiQ7Gallery = [
  { src: IMAGES.fleetInterior.audiQ7[0], title: 'Dashboard', desc: 'Audi\'s virtual cockpit and dual-screen console, precise and driver-focused.' },
  { src: IMAGES.fleetInterior.audiQ7[1], title: 'Rear Seats', desc: 'Spacious rear seating under a full panoramic roof.' },
  { src: IMAGES.fleetInterior.audiQ7[2], title: 'Exterior', desc: 'The Q7\'s bold, understated exterior — sized for a smooth, commanding ride.' },
  { src: IMAGES.fleetInterior.audiQ7[3], title: 'Luggage Space', desc: 'Generous boot space, sized for airport runs and multi-stop days.' },
]

const mercedesSClassGallery = [
  { src: IMAGES.fleetInterior.mercedesSClass[0], title: 'Dashboard', desc: 'The latest Mercedes-Benz cockpit, with dual digital displays front and centre.' },
  { src: IMAGES.fleetInterior.mercedesSClass[1], title: 'Rear Cabin', desc: 'Executive rear seating with ambient lighting for a first-class arrival.' },
  { src: IMAGES.fleetInterior.mercedesSClass[2], title: 'Rear Entertainment', desc: 'Individual rear-seat displays and climate controls for every passenger.' },
  { src: IMAGES.fleetInterior.mercedesSClass[3], title: 'Ambient Lighting', desc: 'Configurable ambient lighting sets the mood for an evening arrival.' },
]

const mercedesEClassGallery = [
  { src: IMAGES.fleetInterior.mercedesEClass[0], title: 'Dashboard', desc: 'A refined, driver-focused cockpit with the latest Mercedes-Benz displays.' },
  { src: IMAGES.fleetInterior.mercedesEClass[1], title: 'Rear Cabin', desc: 'Comfortable rear seating finished in fine leather.' },
  { src: IMAGES.fleetInterior.mercedesEClass[2], title: 'Front Cabin', desc: 'Supportive front seating and a driver-focused steering wheel.' },
  { src: IMAGES.fleetInterior.mercedesEClass[3], title: 'Cockpit', desc: 'A wide view of the dashboard and instrument cluster.' },
]

const skodaSuperbGallery = [
  { src: IMAGES.fleetInterior.skodaSuperb[0], title: 'Luggage Space', desc: 'Generous boot space, sized for airport runs and multi-stop days.' },
  { src: IMAGES.fleetInterior.skodaSuperb[1], title: 'Rear Cabin', desc: 'Class-leading rear legroom in a genuinely comfortable cabin.' },
  { src: IMAGES.fleetInterior.skodaSuperb[2], title: 'Dashboard', desc: 'A clean, well-equipped dashboard with an intuitive touchscreen.' },
  { src: IMAGES.fleetInterior.skodaSuperb[3], title: 'Exterior', desc: 'A sharp, understated exterior finished for smart, low-key transfers.' },
]

const toyotaCamryGallery = [
  { src: IMAGES.fleetInterior.toyotaCamry[0], title: 'Luggage Space', desc: 'A practical, generously sized boot for airport runs and day trips.' },
  { src: IMAGES.fleetInterior.toyotaCamry[1], title: 'Dashboard', desc: 'A driver-focused cockpit with a clear, easy-to-use touchscreen.' },
  { src: IMAGES.fleetInterior.toyotaCamry[2], title: 'Rear Cabin', desc: 'A comfortable, well-cushioned rear seat for four passengers.' },
  { src: IMAGES.fleetInterior.toyotaCamry[3], title: 'Exterior', desc: 'A sharp, reliable sedan finished for smart, everyday transfers.' },
]

const toyotaAlphardGallery = [
  { src: IMAGES.fleetInterior.toyotaAlphard[0], title: 'Dashboard', desc: 'A driver-focused cockpit with a large touchscreen and clean controls.' },
  { src: IMAGES.fleetInterior.toyotaAlphard[1], title: 'Captain Seats', desc: 'Individually adjustable captain\'s chairs with ottoman leg rests for VIP comfort.' },
  { src: IMAGES.fleetInterior.toyotaAlphard[2], title: 'Luggage Space', desc: 'A wide, flat boot with room for multiple large suitcases.' },
  { src: IMAGES.fleetInterior.toyotaAlphard[3], title: 'Exterior', desc: 'A striking, VIP-grade exterior built for a memorable arrival.' },
]

const vwID4Gallery = [
  { src: IMAGES.fleetInterior.vwID4[0], title: 'Dashboard', desc: 'A clean, tech-forward cockpit with a large central touchscreen.' },
  { src: IMAGES.fleetInterior.vwID4[1], title: 'Front Seating', desc: 'Comfortable, well-cushioned front seats for everyday journeys.' },
  { src: IMAGES.fleetInterior.vwID4[2], title: 'Rear Cabin', desc: 'A spacious, well-appointed rear seat for passengers.' },
  { src: IMAGES.fleetInterior.vwID4[3], title: 'Luggage Space', desc: 'A practical boot suited to airport runs and everyday trips.' },
]

const mercedesGLSGallery = [
  { src: IMAGES.fleetInterior.mercedesGLS[0], title: 'Rear Cabin', desc: 'Richly upholstered rear seating built for equal comfort across every row.' },
  { src: IMAGES.fleetInterior.mercedesGLS[1], title: 'Cabin', desc: 'A wide view of the three-row cabin, finished in fine leather throughout.' },
  { src: IMAGES.fleetInterior.mercedesGLS[2], title: 'Front Design', desc: 'The GLS\'s commanding front end, instantly recognisable on arrival.' },
  { src: IMAGES.fleetInterior.mercedesGLS[3], title: 'On the Road', desc: 'A smooth, planted ride whatever the distance.' },
]

const mercedesVitoGallery = [
  { src: IMAGES.fleetInterior.mercedesVito[0], title: 'Captain Seats', desc: 'Configurable captain\'s chairs with ambient lighting for executive-level comfort.' },
  { src: IMAGES.fleetInterior.mercedesVito[1], title: 'Cabin', desc: 'A wide view of the executive cabin, finished to a first-class standard.' },
  { src: IMAGES.fleetInterior.mercedesVito[2], title: 'Luggage Space', desc: 'A wide, flat boot with room for multiple large suitcases and golf bags.' },
  { src: IMAGES.fleetInterior.mercedesVito[3], title: 'Exterior', desc: 'A discreet, professional exterior suited to group and executive transfers.' },
]

const mercedesSprinterGallery = [
  { src: IMAGES.fleetInterior.mercedesSprinter[0], title: 'Driver Cab', desc: 'A clean, well-equipped driver cab with modern infotainment.' },
  { src: IMAGES.fleetInterior.mercedesSprinter[1], title: 'Passenger Seating', desc: 'Executive-configured passenger seating with individual armrests.' },
  { src: IMAGES.fleetInterior.mercedesSprinter[2], title: 'Executive Seating', desc: 'Reclining, individually adjustable seats for longer group journeys.' },
  { src: IMAGES.fleetInterior.mercedesSprinter[3], title: 'Exterior', desc: 'A spacious, professional-grade van built for larger group transfers.' },
]

const rangeRoverGallery = [
  { src: IMAGES.fleetInterior.rangeRover[0], title: 'Rear Seats', desc: 'Hand-finished rear seating with heating, cooling and ambient lighting.' },
  { src: IMAGES.fleetInterior.rangeRover[1], title: 'Rear Bench', desc: 'Spacious rear seating beneath a full panoramic roof.' },
  { src: IMAGES.fleetInterior.rangeRover[2], title: 'Exterior Profile', desc: 'The Range Rover\'s commanding silhouette, unmistakable on the road.' },
  { src: IMAGES.fleetInterior.rangeRover[3], title: 'On the Road', desc: 'Confident, composed handling for city and highway alike.' },
]

const teslaModelYGallery = [
  { src: IMAGES.fleetInterior.teslaModelY[0], title: 'Dashboard', desc: 'A minimalist, tech-forward cabin with a central touchscreen.' },
  { src: IMAGES.fleetInterior.teslaModelY[1], title: 'Rear Seating', desc: 'A spacious, well-cushioned rear seat for passengers.' },
  { src: IMAGES.fleetInterior.teslaModelY[2], title: 'Panoramic Roof', desc: 'A full-length glass roof for a bright, airy cabin.' },
  { src: IMAGES.fleetInterior.teslaModelY[3], title: 'Exterior', desc: 'A sleek, all-electric exterior for a quiet, modern ride.' },
]

const havalH6Gallery = [
  { src: IMAGES.fleetInterior.havalH6[0], title: 'Luggage Space', desc: 'A generous, flexible boot for airport runs and day trips.' },
  { src: IMAGES.fleetInterior.havalH6[1], title: 'Dashboard', desc: 'A modern cockpit with a large touchscreen and clean controls.' },
  { src: IMAGES.fleetInterior.havalH6[2], title: 'Rear Cabin', desc: 'A comfortable, well-cushioned rear seat for passengers.' },
  { src: IMAGES.fleetInterior.havalH6[3], title: 'Exterior', desc: 'A modern, well-equipped SUV suited to everyday comfort transfers.' },
]

const bydAtto3Gallery = [
  { src: IMAGES.fleetInterior.bydAtto3[0], title: 'Dashboard', desc: 'A distinctive, tech-forward cockpit with a bold interior design.' },
  { src: IMAGES.fleetInterior.bydAtto3[1], title: 'Rear Cabin', desc: 'A comfortable rear seat finished in a distinctive two-tone trim.' },
  { src: IMAGES.fleetInterior.bydAtto3[2], title: 'Luggage Space', desc: 'A practical boot suited to shorter city and airport transfers.' },
  { src: IMAGES.fleetInterior.bydAtto3[3], title: 'Exterior', desc: 'A distinctive, all-electric SUV for a quiet, modern ride.' },
]

const galleryB = (model) => [
  { src: IMAGES.fleetGallery.interior2, title: 'Cabin', desc: `Rear cabin appointments in the ${model}, built for executive-level comfort.` },
  { src: IMAGES.fleetGallery.dashboard2, title: 'Dashboard', desc: 'Driver console and controls, kept clean and distraction-free for a smooth ride.' },
  { src: IMAGES.fleetGallery.sunroof2, title: 'Panoramic Roof', desc: 'Open, airy cabin lighting for a more relaxed journey.' },
  { src: IMAGES.fleetGallery.trunk2, title: 'Luggage Space', desc: 'Generous boot space, sized for airport runs and multi-stop days.' },
]

export const FLEET = [
  // ---------------- Luxury Fleet ----------------
  {
    slug: 'bmw-7-series',
    category: 'luxury',
    bodyType: 'sedan',
    title: 'BMW 7 Series',
    tagline: 'Premium Chauffeur',
    passengers: 2,
    luggage: 2,
    shortDesc: 'Flagship executive sedan for airport transfers, corporate travel and special events.',
    heroImage: IMAGES.fleet.bmw7Series,
    gallery: bmw7SeriesGallery,
    description: [
      'The BMW 7 Series is the embodiment of executive luxury chauffeur travel across New Zealand. Powered by a refined powertrain delivering effortless performance, this flagship sedan wraps passengers in a supremely appointed interior featuring heated and ventilated leather seats, four-zone climate control, ambient lighting with 30+ colour options, and a panoramic glass roof. Every detail has been meticulously crafted to ensure the highest standard of comfort for every journey.',
      'Whether you require a seamless airport transfer in Auckland, reliable corporate transportation across the North Island, or a premium ride to a special event, the BMW 7 Series delivers an unmatched first-class chauffeur experience. Advanced driver assistance systems, whisper-quiet cabin insulation, and generous rear legroom make every trip relaxing, productive, and truly memorable.',
    ],
  },
  {
    slug: 'mercedes-gls',
    category: 'luxury',
    bodyType: 'suv',
    title: 'Mercedes-Benz GLS',
    tagline: 'Luxury SUV',
    passengers: 3,
    luggage: 3,
    shortDesc: 'Full-size luxury SUV for groups, families and executive transfers.',
    heroImage: IMAGES.fleet.mercedesGLS,
    gallery: mercedesGLSGallery,
    description: [
      'The Mercedes-Benz GLS brings flagship S-Class luxury to a commanding SUV body. Three rows of richly upholstered seating, adjustable air suspension, and a cabin engineered for near-silent running mean every passenger, from the front seat to the third row, travels in equal comfort. Ambient lighting, dual-zone rear climate control, and expansive glass make the GLS feel as spacious as it is refined.',
      'It\'s the natural choice for group airport transfers, family travel, or executive parties who don\'t want to split into two cars. With genuine seating for up to six passengers plus their luggage, the GLS delivers luxury without compromise on space, right across Auckland and the wider North Island.',
    ],
  },
  {
    slug: 'mercedes-vito-eqv',
    category: 'luxury',
    bodyType: 'van',
    title: 'Mercedes-Benz Vito / EQV',
    tagline: 'Executive Van',
    passengers: 5,
    luggage: 5,
    shortDesc: 'Executive van seating for small groups, with the comfort of a luxury sedan.',
    heroImage: IMAGES.fleet.mercedesVito,
    gallery: mercedesVitoGallery,
    description: [
      'The Mercedes-Benz Vito, and its all-electric EQV sibling, bring genuine executive-car comfort to a van-sized cabin. Configurable captain\'s chairs, individual reading lights, and generous headroom make it the preferred choice for small groups who still expect a first-class chauffeur experience — with the option of a fully electric, zero-emission ride in the EQV.',
      'Perfect for corporate teams travelling together, wedding parties, or families arriving with extra luggage, the Vito/EQV combines the space of a van with the hospitality of a private car, chauffeured door to door anywhere in New Zealand.',
    ],
  },
  {
    slug: 'range-rover',
    category: 'luxury',
    bodyType: 'suv',
    title: 'Range Rover',
    tagline: 'Prestige SUV',
    passengers: 3,
    luggage: 3,
    shortDesc: 'Commanding presence and refined luxury, built for VIP and special-event travel.',
    heroImage: IMAGES.fleet.rangeRover,
    gallery: rangeRoverGallery,
    description: [
      'The Range Rover is unmistakable — a commanding ride height, hand-finished leather interior, and a whisper-quiet cabin that make it one of the most requested vehicles for VIP transport. Air suspension smooths every surface, while heated and cooled seats, a panoramic roof, and premium sound keep passengers immersed in comfort from pick-up to drop-off.',
      'It\'s the vehicle of choice for red-carpet arrivals, VIP airport meet-and-greets, and clients who want their transport to make as strong an impression as their destination.',
    ],
  },
  {
    slug: 'mercedes-s-class',
    category: 'luxury',
    bodyType: 'sedan',
    title: 'Mercedes-Benz S-Class',
    tagline: 'Flagship Sedan',
    passengers: 2,
    luggage: 2,
    shortDesc: 'The benchmark luxury sedan — Mercedes-Benz\'s flagship, chauffeur-driven.',
    heroImage: IMAGES.fleet.mercedesSClass,
    gallery: mercedesSClassGallery,
    description: [
      'The Mercedes-Benz S-Class has long set the benchmark for luxury sedans, and our fleet cars carry that reputation into every booking. Executive rear seating with heating, ventilation and massage functions, a cabin finished in fine leather and real wood trim, and industry-leading noise isolation combine to make the S-Class one of the smoothest, quietest rides available.',
      'From high-stakes business meetings to milestone celebrations, the S-Class is built for passengers who need to arrive composed, comfortable, and ready — whether that\'s a boardroom in the city or an airport gate on the other side of town.',
    ],
  },
  {
    slug: 'mercedes-e-class',
    category: 'luxury',
    bodyType: 'sedan',
    title: 'Mercedes-Benz E-Class',
    tagline: 'Executive Sedan',
    passengers: 2,
    luggage: 2,
    shortDesc: 'A refined executive sedan, ideal for corporate and airport transfers.',
    heroImage: IMAGES.fleet.mercedesEClass,
    gallery: mercedesEClassGallery,
    description: [
      'The Mercedes-Benz E-Class offers a more understated take on luxury — elegant leather seating, ambient interior lighting, and a smooth, refined ride that suits business travel as well as personal occasions. It carries all the comfort and reliability Mercedes-Benz is known for, in a size that\'s easy to schedule for point-to-point trips throughout the day.',
      'It\'s a popular choice for corporate accounts running frequent transfers, airport pick-ups, and meetings across the city, delivering consistent first-class presentation without the premium of a full flagship sedan.',
    ],
  },
  {
    slug: 'toyota-alphard',
    category: 'luxury',
    bodyType: 'van',
    title: 'Toyota Alphard',
    tagline: 'VIP People Mover',
    passengers: 5,
    luggage: 5,
    shortDesc: 'Japan\'s benchmark VIP people mover — spacious, quiet, and impeccably finished.',
    heroImage: IMAGES.fleet.toyotaAlphard,
    gallery: toyotaAlphardGallery,
    description: [
      'The Toyota Alphard is the gold standard for VIP people movers, prized around the world for its captain\'s chair comfort, ottoman leg rests, and hushed cabin. Sliding doors make boarding effortless, while individually adjustable rear seating means every passenger travels in first-class comfort, not just the ones up front.',
      'It\'s an outstanding option for small executive groups, wedding parties, or clients who want the presence of a luxury van with the smooth, car-like ride Toyota is known for.',
    ],
  },
  {
    slug: 'audi-q7',
    category: 'luxury',
    bodyType: 'suv',
    title: 'Audi Q7',
    tagline: 'Luxury SUV',
    passengers: 3,
    luggage: 3,
    shortDesc: 'A refined, tech-forward luxury SUV with room for the whole group.',
    heroImage: IMAGES.fleet.audiQ7,
    gallery: audiQ7Gallery,
    description: [
      'The Audi Q7 combines Audi\'s precise, tech-forward design with genuine three-row practicality. A virtual cockpit display, quilted leather seating, and adaptive air suspension make for a composed, quiet ride whatever the road surface, while the third row folds away easily when extra luggage space is needed instead.',
      'It suits family travel, small group transfers, and clients who want SUV practicality without stepping down from a luxury cabin experience — ideal for longer North Island touring days as much as city transfers.',
    ],
  },
  {
    slug: 'mercedes-sprinter-519',
    category: 'luxury',
    bodyType: 'sprinter',
    // Group vehicle — priced/handled as a custom quote, not instant online
    // booking. See FleetCard's "Get a Quote" CTA override for this slug.
    quoteOnly: true,
    title: 'Mercedes-Benz Sprinter 519',
    tagline: 'Group Chauffeur',
    passengers: 16,
    luggage: 10,
    shortDesc: 'Executive-configured Sprinter for larger groups who still expect first-class service.',
    heroImage: IMAGES.fleet.mercedesSprinter,
    gallery: mercedesSprinterGallery,
    description: [
      'The Mercedes-Benz Sprinter 519 is fitted out in an executive configuration — premium upholstered seating, individual air vents, and generous headroom throughout, rather than the bare-bones layout typical of standard vans. It\'s built to move larger groups without asking anyone to compromise on comfort.',
      'From wedding parties and corporate teams to group airport transfers and multi-day tours, the Sprinter 519 keeps everyone together in one vehicle, chauffeured by a single professional driver, with luggage space to match.',
    ],
  },
  {
    slug: 'mercedes-sprinter-316',
    category: 'luxury',
    bodyType: 'sprinter',
    // Same group-quote handling as the Sprinter 519 above — a smaller
    // 12-seater option for groups that don't need the full 16-seater.
    quoteOnly: true,
    title: 'Mercedes-Benz Sprinter 316',
    tagline: 'Group Shuttle',
    passengers: 12,
    luggage: 8,
    shortDesc: 'A more compact Sprinter for mid-sized groups, without compromising on chauffeured comfort.',
    heroImage: IMAGES.fleet.mercedesSprinter316,
    gallery: galleryA('Sprinter 316'),
    description: [
      'The Mercedes-Benz Sprinter 316 gives mid-sized groups the same chauffeured, executive-standard service as our larger Sprinter 519, in a more compact 12-seat configuration. Comfortable upholstered seating and generous headroom make it a natural fit for groups that don\'t need the full 16-seater.',
      'Ideal for smaller wedding parties, corporate teams, and group airport transfers where everyone still travels together in one vehicle with a single professional driver.',
    ],
  },

  // ---------------- Premium Economy Fleet ----------------
  {
    slug: 'tesla-model-y',
    category: 'economy',
    bodyType: 'suv',
    title: 'Tesla Model Y',
    tagline: 'Electric Comfort',
    passengers: 4,
    luggage: 3,
    // Comfort SUV capacity
    shortDesc: 'A smooth, silent all-electric ride with modern tech and generous cargo space.',
    heroImage: IMAGES.fleet.teslaModelY,
    gallery: teslaModelYGallery,
    description: [
      'The Tesla Model Y offers a strikingly smooth, near-silent ride thanks to its all-electric drivetrain, paired with a minimalist interior, panoramic glass roof, and a spacious cabin that comfortably seats four passengers plus luggage in both the front and rear cargo areas.',
      'It\'s a popular pick for clients who value a modern, sustainable transfer without compromising on comfort — well suited to airport runs, city transfers, and day-to-day corporate travel.',
    ],
  },
  {
    slug: 'volkswagen-id4',
    category: 'economy',
    bodyType: 'suv',
    title: 'Volkswagen ID.4',
    tagline: 'Electric Comfort',
    passengers: 4,
    luggage: 3,
    shortDesc: 'A comfortable, quiet electric SUV built for everyday chauffeur transfers.',
    heroImage: IMAGES.fleet.vwID4,
    gallery: vwID4Gallery,
    description: [
      'The Volkswagen ID.4 brings a calm, well-insulated cabin and an easy, composed ride to everyday transfers. Its electric drivetrain means a smooth, quiet journey, while the SUV body gives passengers and luggage more room to spread out than a standard sedan.',
      'It\'s a dependable choice for point-to-point transfers, airport pick-ups, and corporate travel where comfort and consistency matter more than outright flash.',
    ],
  },
  {
    slug: 'skoda-superb',
    category: 'economy',
    bodyType: 'sedan',
    title: 'Škoda Superb',
    tagline: 'Premium Comfort',
    passengers: 3,
    luggage: 2,
    shortDesc: 'A spacious, well-appointed sedan offering excellent ride comfort and cabin space.',
    heroImage: IMAGES.fleet.skodaSuperb,
    gallery: skodaSuperbGallery,
    description: [
      'The Škoda Superb lives up to its name with class-leading rear legroom, a refined ride, and a genuinely comfortable cabin for four passengers. It\'s a quietly impressive choice — understated on the outside, but generous with space and comfort once inside.',
      'A reliable option for airport transfers, business travel, and day-to-day bookings where passengers want room to relax without the premium of our luxury-class vehicles.',
    ],
  },
  {
    slug: 'haval-h6',
    category: 'economy',
    bodyType: 'suv',
    title: 'Haval H6',
    tagline: 'Comfort SUV',
    passengers: 4,
    luggage: 3,
    shortDesc: 'A well-equipped mid-size SUV offering a comfortable, easy ride.',
    heroImage: IMAGES.fleet.havalH6,
    gallery: havalH6Gallery,
    description: [
      'The Haval H6 offers a comfortable, well-cushioned ride with a roomy cabin and modern in-car features, making it a practical choice for passengers who want SUV space at an approachable price point.',
      'Well suited to airport transfers, local trips, and everyday bookings where reliability and comfort come first.',
    ],
  },
  {
    slug: 'toyota-rav4',
    category: 'economy',
    bodyType: 'suv',
    title: 'Toyota RAV4',
    tagline: 'Comfort SUV',
    passengers: 4,
    luggage: 3,
    shortDesc: 'A dependable, comfortable SUV with plenty of room for passengers and luggage.',
    heroImage: IMAGES.fleet.toyotaRAV4,
    gallery: galleryA('Toyota RAV4'),
    description: [
      'The Toyota RAV4 is known for its dependable ride quality, comfortable seating, and generous boot space — a practical, no-fuss choice for passengers who want a smooth, spacious trip without extra frills.',
      'A solid choice for airport transfers, family travel, and everyday point-to-point bookings across the region.',
    ],
  },
  {
    slug: 'byd-atto-3',
    category: 'economy',
    bodyType: 'suv',
    title: 'BYD Atto 3',
    tagline: 'Electric Comfort',
    passengers: 4,
    luggage: 3,
    shortDesc: 'A modern, all-electric SUV offering a quiet, comfortable ride.',
    heroImage: IMAGES.fleet.bydAtto3,
    gallery: bydAtto3Gallery,
    description: [
      'The BYD Atto 3 is a modern all-electric SUV with a distinctive, tech-forward cabin and a smooth, quiet ride. Its compact footprint makes it easy to schedule for city transfers, while the electric drivetrain keeps the journey calm and emission-free.',
      'A great option for clients who prioritise a sustainable ride for shorter airport and city transfers.',
    ],
  },
  {
    slug: 'toyota-camry',
    category: 'economy',
    bodyType: 'sedan',
    title: 'Toyota Camry',
    tagline: 'Premium Comfort',
    passengers: 3,
    luggage: 2,
    shortDesc: 'A reliable, comfortable sedan — a trusted choice for everyday chauffeur travel.',
    heroImage: IMAGES.fleet.toyotaCamry,
    gallery: toyotaCamryGallery,
    description: [
      'The Toyota Camry is one of the most trusted sedans on the road, offering a smooth, quiet ride and a comfortable cabin for four passengers. Its reliability and consistency make it a dependable everyday choice for chauffeur travel.',
      'Frequently booked for airport transfers, corporate travel, and day-to-day trips where passengers want a comfortable, no-surprises ride.',
    ],
  },
  {
    slug: 'haval-jolion',
    category: 'economy',
    bodyType: 'suv',
    title: 'Haval Jolion',
    tagline: 'Comfort SUV',
    passengers: 4,
    luggage: 3,
    shortDesc: 'A compact SUV offering a comfortable ride for shorter transfers.',
    heroImage: IMAGES.fleet.havalJolion,
    gallery: galleryB('Haval Jolion'),
    description: [
      'The Haval Jolion is a compact SUV with a comfortable cabin and easy manoeuvrability, making it a practical option for shorter city transfers and everyday bookings.',
      'A convenient choice for solo travellers and small groups who want SUV comfort on quick point-to-point trips.',
    ],
  },
]

export const LUXURY_FLEET = FLEET.filter((v) => v.category === 'luxury')
export const ECONOMY_FLEET = FLEET.filter((v) => v.category === 'economy')

export function getVehicleBySlug(slug) {
  return FLEET.find((v) => v.slug === slug)
}

// Two standalone fleet pages, one per category. The internal `category`
// field on each vehicle stays 'luxury' / 'economy' (unchanged, avoids
// touching every vehicle record) — 'economy' is just renamed to "Comfort
// Fleet" for display, with its own URL slug ('comfort', not 'economy').
export const FLEET_CATEGORIES = {
  luxury: {
    urlSlug: 'luxury',
    label: 'Luxury Fleet',
    eyebrow: 'Premium Class',
    heading: 'The Luxury Fleet',
    intro: 'Flagship sedans, SUVs and executive vans for clients who want every journey to feel like an occasion — airport transfers, corporate travel, weddings and VIP events.',
    heroImage: IMAGES.fleet.mercedesSClass,
    vehicles: () => LUXURY_FLEET,
  },
  economy: {
    urlSlug: 'comfort',
    label: 'Comfort Fleet',
    eyebrow: 'Everyday Class',
    heading: 'The Comfort Fleet',
    intro: 'Well-appointed sedans and SUVs for reliable, comfortable everyday travel — airport runs, corporate accounts and day-to-day bookings, chauffeured with the same professionalism throughout.',
    heroImage: IMAGES.fleet.teslaModelY,
    vehicles: () => ECONOMY_FLEET,
  },
}

// vehicle.category ('luxury' | 'economy') -> the category page URL
export function categoryPath(category) {
  const cat = FLEET_CATEGORIES[category]
  return `/fleet/${cat ? cat.urlSlug : 'luxury'}`
}

// URL slug ('luxury' | 'comfort') -> the FLEET_CATEGORIES config
export function getCategoryByUrlSlug(urlSlug) {
  return Object.values(FLEET_CATEGORIES).find((c) => c.urlSlug === urlSlug)
}

// The 6 category tiles shown on the homepage fleet section (3 columns x 2
// rows) — "Business" is the client-facing name for the internal 'luxury'
// category, "Economy" for 'economy'. Sprinter is a 7th, quote-only category
// that intentionally isn't shown here (only on the booking form) since it's
// not an instant-book vehicle. Each tile links to the matching fleet page
// pre-filtered to that body type via ?type=. `sample` is just used to pick a
// representative tile image — the tile links through to the full filtered
// list, it doesn't limit it to one vehicle.
function sampleImage(list) {
  return list[0]?.heroImage
}

export const HOME_FLEET_CATEGORIES = [
  { label: 'Economy Sedan', bodyType: 'sedan', category: 'economy', image: sampleImage(ECONOMY_FLEET.filter((v) => v.bodyType === 'sedan')) },
  { label: 'Economy SUV', bodyType: 'suv', category: 'economy', image: sampleImage(ECONOMY_FLEET.filter((v) => v.bodyType === 'suv')) },
  { label: 'Economy Van', bodyType: 'van', category: 'economy', image: sampleImage(ECONOMY_FLEET.filter((v) => v.bodyType === 'van')) || IMAGES.fleet.vwID4 },
  { label: 'Business Sedan', bodyType: 'sedan', category: 'luxury', image: sampleImage(LUXURY_FLEET.filter((v) => v.bodyType === 'sedan')) },
  { label: 'Business SUV', bodyType: 'suv', category: 'luxury', image: sampleImage(LUXURY_FLEET.filter((v) => v.bodyType === 'suv')) },
  { label: 'Business Van', bodyType: 'van', category: 'luxury', image: sampleImage(LUXURY_FLEET.filter((v) => v.bodyType === 'van')) },
].map((c) => ({ ...c, href: `${categoryPath(c.category)}?type=${c.bodyType}` }))
