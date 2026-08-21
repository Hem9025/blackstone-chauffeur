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
    bmw7Series: '/images/fleet/hero/bmw-7-series-new.jpg',
    mercedesGLS: '/images/fleet/hero/mercedes-gls-new.jpg',
    bmwI7: '/images/fleet/hero/bmw-i7.jpg',
    mercedesVito: '/images/fleet/hero/mercedes-vito-eqv-new.jpg',
    rangeRover: '/images/fleet/hero/range-rover-new.jpg',
    mercedesSClass: '/images/fleet/hero/mercedes-s-class-new.jpg',
    // No H-1 supplied for the E-Class — keeping the existing hero as instructed.
    mercedesEClass: unsplash('photo-1625690096555-a0a4d190901c', 1400),
    toyotaAlphard: '/images/fleet/hero/toyota-alphard-new.jpg',
    audiQ7: '/images/fleet/hero/audi-q7-new.jpg',
    mercedesSprinter: '/images/fleet/hero/mercedes-sprinter-519-new.jpg',
    // No H-1 supplied for the Sprinter 316 — keeping the existing hero as instructed.
    mercedesSprinter316: unsplash('photo-1775053392841-7fa6dabdb760', 1400),
    // Real client photo of the Hiace, supplied in the "Comfort Class/Haice"
    // folder — replaces the earlier Unsplash placeholder.
    toyotaHiace: '/images/fleet/hero/toyota-hiace.jpg',

    // Premium economy fleet
    teslaModelY: '/images/fleet/hero/tesla-model-y-new.jpg',
    vwID4: '/images/fleet/hero/volkswagen-id4-new.jpg',
    skodaSuperb: '/images/fleet/hero/skoda-superb-new.jpg',
    havalH6: '/images/fleet/hero/haval-h6-new.jpg',
    toyotaRAV4: '/images/fleet/hero/toyota-rav4.jpg',
    bydAtto3: '/images/fleet/hero/byd-atto-3-new.jpg',
    // No H-1 supplied for the Camry — keeping the existing hero as instructed.
    toyotaCamry: unsplash('photo-1621007947382-bb3c3994e3fb', 1400),
    havalJolion: '/images/fleet/hero/haval-jolion.jpg',
    toyotaPrius: unsplash('photo-1551952237-954a0e68786c', 1400),
  },

  // Homepage "Our Fleet" tiles only — clean cutout/studio-style car icons on
  // a plain backdrop (client-supplied), one per body-type/vehicle tile. Not
  // used anywhere else (fleet detail pages keep their real photo heroes).
  // Comfort tiles use light/silver-white vehicle shots; Luxury (and the two
  // Sprinter spotlight tiles, which are catalogued under 'luxury') use black
  // vehicle shots — a deliberate light/dark split between the two tiers.
  // The `?v=2` on the seven re-cropped files below is a cache-buster, not a
  // real query param the server does anything with — these live in
  // public/, so Vite never fingerprints their URL the way it does bundled
  // assets, meaning overwriting the file in place (as happened when they
  // were re-cropped) keeps the exact same URL. Any cache sitting in front
  // of the server (browser, CDN, or Hostinger's own) has no way to know the
  // content changed and can go on serving the old bytes indefinitely — this
  // is exactly what happened after that crop shipped. Bump this number any
  // time one of these seven files is replaced again; the two untouched
  // business-*.png files don't need one since their content hasn't changed.
  homeFleetIcons: {
    economySedan: '/images/fleet/icons/comfort-sedan.jpg?v=2',
    economySuv: '/images/fleet/icons/comfort-suv.jpg?v=2',
    economyVan: '/images/fleet/icons/comfort-van.jpg?v=2',
    comfort12SeaterVan: '/images/fleet/icons/comfort-12-seater-van.jpg?v=2',
    electric: '/images/fleet/icons/electric.jpg?v=2',
    businessSedan: '/images/fleet/icons/business-sedan.png',
    businessSuv: '/images/fleet/icons/business-suv.png',
    businessVan: '/images/fleet/icons/business-van.png',
    sprinter316: '/images/fleet/icons/sprinter-316.jpg?v=2',
    sprinter519: '/images/fleet/icons/sprinter-519.jpg?v=2',
  },

  // Real client-supplied interior photography for specific fleet vehicles
  // (everything else still uses the shared placeholder `fleetGallery` below
  // until real photos are supplied for them too). Hero/exterior images for
  // these vehicles are untouched — only their detail-page gallery changes.
  fleetInterior: {
    bmw7Series: [
      '/images/fleet/interior/bmw-7-series/new-1.jpg',
      '/images/fleet/interior/bmw-7-series/new-2.jpg',
      '/images/fleet/interior/bmw-7-series/new-3.jpg',
      '/images/fleet/interior/bmw-7-series/new-4.jpg',
    ],
    audiQ7: [
      '/images/fleet/interior/audi-q7/new-1.jpg',
      '/images/fleet/interior/audi-q7/new-2.jpg',
      '/images/fleet/interior/audi-q7/new-3.jpg',
    ],
    mercedesSClass: [
      '/images/fleet/interior/mercedes-s-class/new-1.jpg',
      '/images/fleet/interior/mercedes-s-class/new-2.jpg',
      '/images/fleet/interior/mercedes-s-class/new-3.jpg',
      '/images/fleet/interior/mercedes-s-class/new-4.jpg',
    ],
    mercedesEClass: [
      '/images/fleet/interior/mercedes-e-class/new-1.jpg',
      '/images/fleet/interior/mercedes-e-class/new-2.jpg',
      '/images/fleet/interior/mercedes-e-class/new-3.jpg',
      '/images/fleet/interior/mercedes-e-class/new-4.jpg',
    ],
    skodaSuperb: [
      '/images/fleet/interior/skoda-superb/new-1.jpg',
      '/images/fleet/interior/skoda-superb/new-2.jpg',
      '/images/fleet/interior/skoda-superb/new-3.jpg',
      '/images/fleet/interior/skoda-superb/new-4.jpg',
    ],
    toyotaCamry: [
      '/images/fleet/interior/toyota-camry/new-1.jpg',
      '/images/fleet/interior/toyota-camry/new-2.jpg',
      '/images/fleet/interior/toyota-camry/new-3.jpg',
      '/images/fleet/interior/toyota-camry/new-4.jpg',
    ],
    toyotaAlphard: [
      '/images/fleet/interior/toyota-alphard/new-1.jpg',
      '/images/fleet/interior/toyota-alphard/new-2.jpg',
      '/images/fleet/interior/toyota-alphard/new-3.jpg',
      '/images/fleet/interior/toyota-alphard/new-4.jpg',
    ],
    bmwI7: [
      '/images/fleet/interior/bmw-i7/1-dashboard.jpg',
      '/images/fleet/interior/bmw-i7/2-rear-cabin.jpg',
      '/images/fleet/interior/bmw-i7/3-headrest-detail.jpg',
      '/images/fleet/interior/bmw-i7/4-front-seat.jpg',
    ],
    vwID4: [
      '/images/fleet/interior/volkswagen-id4/new-1.jpg',
      '/images/fleet/interior/volkswagen-id4/new-2.jpg',
      '/images/fleet/interior/volkswagen-id4/new-3.jpg',
      '/images/fleet/interior/volkswagen-id4/new-4.jpg',
    ],
    mercedesGLS: [
      '/images/fleet/interior/mercedes-gls/new-1.jpg',
      '/images/fleet/interior/mercedes-gls/new-2.jpg',
      '/images/fleet/interior/mercedes-gls/new-3.jpg',
    ],
    mercedesVito: [
      '/images/fleet/interior/mercedes-vito-eqv/new-1.jpg',
      '/images/fleet/interior/mercedes-vito-eqv/new-2.jpg',
      '/images/fleet/interior/mercedes-vito-eqv/new-3.jpg',
      '/images/fleet/interior/mercedes-vito-eqv/new-4.jpg',
    ],
    mercedesSprinter: [
      '/images/fleet/interior/mercedes-sprinter-519/new-1.jpg',
      '/images/fleet/interior/mercedes-sprinter-519/new-2.jpg',
      '/images/fleet/interior/mercedes-sprinter-519/new-3.jpg',
      '/images/fleet/interior/mercedes-sprinter-519/new-4.jpg',
    ],
    mercedesSprinter316: [
      '/images/fleet/interior/mercedes-sprinter-316/new-1.jpg',
      '/images/fleet/interior/mercedes-sprinter-316/new-2.jpg',
      '/images/fleet/interior/mercedes-sprinter-316/new-3.jpg',
      '/images/fleet/interior/mercedes-sprinter-316/new-4.jpg',
    ],
    rangeRover: [
      '/images/fleet/interior/range-rover/new-1.jpg',
      '/images/fleet/interior/range-rover/new-2.jpg',
      '/images/fleet/interior/range-rover/new-3.jpg',
      '/images/fleet/interior/range-rover/new-4.jpg',
    ],
    teslaModelY: [
      '/images/fleet/interior/tesla-model-y/new-1.jpg',
      '/images/fleet/interior/tesla-model-y/new-2.jpg',
      '/images/fleet/interior/tesla-model-y/new-3.jpg',
      '/images/fleet/interior/tesla-model-y/new-4.jpg',
    ],
    havalH6: [
      '/images/fleet/interior/haval-h6/new-1.jpg',
      '/images/fleet/interior/haval-h6/new-2.jpg',
      '/images/fleet/interior/haval-h6/new-3.jpg',
      '/images/fleet/interior/haval-h6/new-4.jpg',
    ],
    bydAtto3: [
      '/images/fleet/interior/byd-atto-3/new-1.jpg',
      '/images/fleet/interior/byd-atto-3/new-2.jpg',
      '/images/fleet/interior/byd-atto-3/new-3.jpg',
      '/images/fleet/interior/byd-atto-3/new-4.jpg',
    ],
    // Real client photos of the Hiace — replaces the earlier Unsplash set.
    toyotaHiace: [
      '/images/fleet/interior/toyota-hiace/new-1.jpg',
      '/images/fleet/interior/toyota-hiace/new-2.jpg',
      '/images/fleet/interior/toyota-hiace/new-3.jpg',
      '/images/fleet/interior/toyota-hiace/new-4.jpg',
    ],
    toyotaRAV4: [
      '/images/fleet/interior/toyota-rav4/new-1.jpg',
      '/images/fleet/interior/toyota-rav4/new-2.jpg',
      '/images/fleet/interior/toyota-rav4/new-3.jpg',
      '/images/fleet/interior/toyota-rav4/new-4.jpg',
    ],
    havalJolion: [
      '/images/fleet/interior/haval-jolion/new-1.jpg',
      '/images/fleet/interior/haval-jolion/new-2.jpg',
      '/images/fleet/interior/haval-jolion/new-3.jpg',
      '/images/fleet/interior/haval-jolion/new-4.jpg',
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
  // Real client shot of the fleet actually on the move through the city —
  // pairs with the "Delivering Excellence in Every Journey" heading next
  // to it better than a static greeting shot did.
  aboutSecondary: '/images/gallery/2-bmw-7-series-city.jpg',

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
