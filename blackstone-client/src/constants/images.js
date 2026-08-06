// Curated stock photography (Unsplash — free to use under the Unsplash License)
// used as placeholders until the client supplies real fleet/event photography.
// Swap any of these for local assets once available.

const unsplash = (id, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const IMAGES = {
  // Homepage hero — stock Rolls-Royce Ghost shot as a placeholder until a
  // real photo of the client's own vehicle is supplied.
  hero: unsplash('photo-1740098160485-d098fbf42814', 1800),
  heroAlt: unsplash('photo-1500632907344-a073709b2448', 1800),

  fleet: {
    sedan1: unsplash('photo-1609521233053-345bfa8b6f17'),
    sedan2: unsplash('photo-1655827763440-7905302b75ff'),
    suv1: unsplash('photo-1673166105764-a6aa7e0e73a7'),
    suv2: unsplash('photo-1678305961875-14e14986e514'),
    van1: unsplash('photo-1710343491609-0cbc6c14b92d'),
    van2: unsplash('photo-1775637483812-fee34cccf8d7'),

    // Luxury fleet — real client photos where supplied, stock placeholder
    // otherwise (Mercedes S-Class/E-Class hero stays stock per instruction;
    // Toyota Alphard/Sprinter 519 hero also has no fleet.js listing distinct
    // from these keys, see below).
    bmw7Series: unsplash('photo-1601362840469-51e4d8d58785', 1400),
    mercedesGLS: '/images/fleet/hero/mercedes-gls.jpg',
    bmwI7: '/images/fleet/hero/bmw-i7.jpg',
    mercedesVito: '/images/fleet/hero/mercedes-vito-eqv.jpg',
    rangeRover: '/images/fleet/hero/range-rover.jpg',
    mercedesSClass: unsplash('photo-1619221496652-7ee3d7406203', 1400),
    mercedesEClass: unsplash('photo-1625690096555-a0a4d190901c', 1400),
    toyotaAlphard: '/images/fleet/hero/toyota-alphard.jpg',
    audiQ7: unsplash('photo-1651751234256-86187ebf7302', 1400),
    mercedesSprinter: '/images/fleet/hero/mercedes-sprinter-519.jpg',

    // Premium economy fleet
    teslaModelY: '/images/fleet/hero/tesla-model-y.jpg',
    vwID4: '/images/fleet/hero/volkswagen-id4.jpg',
    skodaSuperb: unsplash('photo-1560282013-aa23a6e5e1a6', 1400),
    havalH6: '/images/fleet/hero/haval-h6.jpg',
    toyotaRAV4: unsplash('photo-1632137924251-fcea5ff46035', 1400),
    bydAtto3: '/images/fleet/hero/byd-atto-3.jpg',
    toyotaCamry: unsplash('photo-1621007947382-bb3c3994e3fb', 1400),
    havalJolion: unsplash('photo-1615887110697-0819ec23465f', 1400),
    toyotaPrius: unsplash('photo-1551952237-954a0e68786c', 1400),
  },

  // Real client-supplied interior photography for specific fleet vehicles
  // (everything else still uses the shared placeholder `fleetGallery` below
  // until real photos are supplied for them too). Hero/exterior images for
  // these vehicles are untouched — only their detail-page gallery changes.
  fleetInterior: {
    bmw7Series: [
      '/images/fleet/interior/bmw-7-series/1-rear-cabin.jpg',
      '/images/fleet/interior/bmw-7-series/2-dashboard.jpg',
      '/images/fleet/interior/bmw-7-series/3-sunroof.jpg',
      '/images/fleet/interior/bmw-7-series/4-front-dash.jpg',
    ],
    audiQ7: [
      '/images/fleet/interior/audi-q7/1-dashboard.jpg',
      '/images/fleet/interior/audi-q7/2-rear-seats.jpg',
      '/images/fleet/interior/audi-q7/3-exterior.jpg',
      '/images/fleet/interior/audi-q7/4-luggage-space.jpg',
    ],
    mercedesSClass: [
      '/images/fleet/interior/mercedes-s-class/1-dashboard.jpg',
      '/images/fleet/interior/mercedes-s-class/2-rear-cabin.jpg',
      '/images/fleet/interior/mercedes-s-class/3-rear-screens.jpg',
      '/images/fleet/interior/mercedes-s-class/4-ambient-lighting.jpg',
    ],
    mercedesEClass: [
      '/images/fleet/interior/mercedes-e-class/1-dashboard.jpg',
      '/images/fleet/interior/mercedes-e-class/2-rear-seat.jpg',
      '/images/fleet/interior/mercedes-e-class/3-front-seat.jpg',
      '/images/fleet/interior/mercedes-e-class/4-dash-wide.jpg',
    ],
    skodaSuperb: [
      '/images/fleet/interior/skoda-superb/1-boot.jpg',
      '/images/fleet/interior/skoda-superb/2-rear-seat.jpg',
      '/images/fleet/interior/skoda-superb/3-dashboard.jpg',
      '/images/fleet/interior/skoda-superb/4-exterior.jpg',
    ],
    toyotaCamry: [
      '/images/fleet/interior/toyota-camry/1-boot.jpg',
      '/images/fleet/interior/toyota-camry/2-dashboard.jpg',
      '/images/fleet/interior/toyota-camry/3-rear-seat.jpg',
      '/images/fleet/interior/toyota-camry/4-exterior.jpg',
    ],
    toyotaAlphard: [
      '/images/fleet/interior/toyota-alphard/1-dashboard.jpg',
      '/images/fleet/interior/toyota-alphard/2-captain-seats.jpg',
      '/images/fleet/interior/toyota-alphard/3-boot.jpg',
      '/images/fleet/interior/toyota-alphard/4-exterior.jpg',
    ],
    bmwI7: [
      '/images/fleet/interior/bmw-i7/1-dashboard.jpg',
      '/images/fleet/interior/bmw-i7/2-rear-cabin.jpg',
      '/images/fleet/interior/bmw-i7/3-headrest-detail.jpg',
      '/images/fleet/interior/bmw-i7/4-front-seat.jpg',
    ],
    vwID4: [
      '/images/fleet/interior/volkswagen-id4/1-dashboard.jpg',
      '/images/fleet/interior/volkswagen-id4/2-front-seat.jpg',
      '/images/fleet/interior/volkswagen-id4/3-rear-seat.jpg',
      '/images/fleet/interior/volkswagen-id4/4-boot.jpg',
    ],
    mercedesGLS: [
      '/images/fleet/interior/mercedes-gls/1-rear-seat.jpg',
      '/images/fleet/interior/mercedes-gls/2-cabin-wide.jpg',
      '/images/fleet/interior/mercedes-gls/3-front-design.jpg',
      '/images/fleet/interior/mercedes-gls/4-on-the-road.jpg',
    ],
    mercedesVito: [
      '/images/fleet/interior/mercedes-vito-eqv/1-captain-seats.jpg',
      '/images/fleet/interior/mercedes-vito-eqv/2-cabin-wide.jpg',
      '/images/fleet/interior/mercedes-vito-eqv/3-luggage-space.jpg',
      '/images/fleet/interior/mercedes-vito-eqv/4-exterior.jpg',
    ],
    mercedesSprinter: [
      '/images/fleet/interior/mercedes-sprinter-519/1-cab.jpg',
      '/images/fleet/interior/mercedes-sprinter-519/2-passenger-seats.jpg',
      '/images/fleet/interior/mercedes-sprinter-519/3-executive-seating.jpg',
      '/images/fleet/interior/mercedes-sprinter-519/4-exterior.jpg',
    ],
    rangeRover: [
      '/images/fleet/interior/range-rover/1-rear-seats.jpg',
      '/images/fleet/interior/range-rover/2-rear-bench.jpg',
      '/images/fleet/interior/range-rover/3-exterior-profile.jpg',
      '/images/fleet/interior/range-rover/4-on-the-road.jpg',
    ],
    teslaModelY: [
      '/images/fleet/interior/tesla-model-y/1-dashboard.jpg',
      '/images/fleet/interior/tesla-model-y/2-rear-seat.jpg',
      '/images/fleet/interior/tesla-model-y/3-panoramic-roof.jpg',
      '/images/fleet/interior/tesla-model-y/4-exterior.jpg',
    ],
    havalH6: [
      '/images/fleet/interior/haval-h6/1-boot.jpg',
      '/images/fleet/interior/haval-h6/2-dashboard.jpg',
      '/images/fleet/interior/haval-h6/3-rear-seat.jpg',
      '/images/fleet/interior/haval-h6/4-exterior.jpg',
    ],
    bydAtto3: [
      '/images/fleet/interior/byd-atto-3/1-dashboard.jpg',
      '/images/fleet/interior/byd-atto-3/2-rear-seat.jpg',
      '/images/fleet/interior/byd-atto-3/3-boot.jpg',
      '/images/fleet/interior/byd-atto-3/4-exterior.jpg',
    ],
  },

  // Shared detail-shot gallery reused across vehicle detail pages
  // (interior, dashboard, sunroof, boot space).
  fleetGallery: {
    interior1: unsplash('photo-1687634366070-c06d3f037154', 1000),
    interior2: unsplash('photo-1614530499660-fe1fbd7921d6', 1000),
    dashboard1: unsplash('photo-1542834506-979b3951bc9a', 1000),
    dashboard2: unsplash('photo-1471174617910-3e9c04f58ff5', 1000),
    sunroof1: unsplash('photo-1661993745460-c16e6a83b718', 1000),
    sunroof2: unsplash('photo-1602612056251-07ff861e3743', 1000),
    trunk1: unsplash('photo-1602161755661-3781cddac355', 1000),
    trunk2: unsplash('photo-1688054004445-7c9108eb4005', 1000),
  },

  // Real client-supplied photography where a clean match exists; wedding,
  // nightclub and tour keep the stock placeholder since no matching photo
  // was supplied for those specific services.
  services: {
    airport: '/images/services/airport.jpg',
    corporate: '/images/services/corporate.jpg',
    wedding: '/images/home/wedding-evening-arrival.jpg',
    tour: unsplash('photo-1500632907344-a073709b2448'),
    hourly: '/images/services/hourly.jpg',
    special: '/images/services/special.jpg',
    nightclub: unsplash('photo-1566737236500-c8ac43014a67'),
    vip: '/images/services/vip.jpg',
    businessMeeting: '/images/services/business-meeting.jpg',
    pointToPoint: '/images/services/point-to-point.jpg',
    sightseeing: '/images/services/sightseeing.jpg',
    luxuryFleet: '/images/services/luxury-fleet.jpg',
  },

  places: {
    aucklandDomain: unsplash('photo-1500632907344-a073709b2448'),
    skyTower: unsplash('photo-1600208669687-f19af3638cb9'),
    skyTowerAlt: unsplash('photo-1576828324911-1e301982b17f'),
    viaductHarbour: unsplash('photo-1702970837017-35ccd086feaa'),
    westAucklandWineries: unsplash('photo-1626125911203-5cbfcb63a33f'),
    pihaBeach: unsplash('photo-1494426108773-9cc6ba34512a'),
    pihaBeachAlt: unsplash('photo-1632761731184-f3727dcf0ecc'),
    waihekeIsland: unsplash('photo-1710563447214-a856ea672171'),
    hobbiton: unsplash('photo-1590549123295-71868c623c79'),
    hobbitonAlt: unsplash('photo-1672131311473-97a724634683'),
    waitomoCaves: unsplash('photo-1577729182857-5202978ad76c'),
    waitomoCavesAlt: unsplash('photo-1550992402-9b1fc58fd76d'),
    rotoruaGeothermal: unsplash('photo-1704584645085-f5518f3473ce'),
    bayOfIslands: unsplash('photo-1593210563043-6bec3f4bebee'),
    queenstown: '/images/tours/queenstown/hero-lake-wakatipu.jpg',
    queenstownAlt: '/images/tours/queenstown/1-skyline-gondola.jpg',
    christchurch: '/images/tours/christchurch/hero-tram.jpg',
    milfordSound: unsplash('photo-1591640040362-f55d95a6b2bc'),
    milfordSoundAlt: unsplash('photo-1735924527360-5d9e8dd8bebf'),
  },

  about: unsplash('photo-1772631340503-55136169d9ae', 1400),
  aboutSecondary: unsplash('photo-1772909654571-d4a21cc0785f', 1000),

  // Real client-supplied photography — fleet, weddings, and airport/hotel
  // arrivals. Number plates are blurred for privacy.
  gallery: [
    '/images/gallery/1-wedding-fleet-lineup.jpg',
    '/images/gallery/2-bmw-7-series-city.jpg',
    '/images/gallery/3-sprinter-van-fleet.jpg',
    '/images/gallery/4-chauffeur-greeting-guests.jpg',
    '/images/gallery/5-bmw-7-series-wedding.jpg',
    '/images/gallery/6-palm-court-arrival.jpg',
    '/images/gallery/7-evening-arrival.jpg',
    '/images/gallery/8-guests-boarding.jpg',
  ],

  testimonialAvatars: [
    'https://i.pravatar.cc/150?img=12',
    'https://i.pravatar.cc/150?img=32',
    'https://i.pravatar.cc/150?img=47',
  ],
}
