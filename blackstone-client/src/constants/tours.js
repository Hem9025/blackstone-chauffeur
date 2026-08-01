import { IMAGES } from './images'

// Sample day itineraries — illustrative starting points, not fixed schedules.
// Each tour page shows "*Itinerary is flexible and can be customised to your
// preferences" so timings here are indicative only.

export const TOURS = [
  // ---- North Island ----
  {
    slug: 'auckland-city-tour',
    region: 'north',
    title: 'Auckland City Tour',
    shortDesc: 'A full day exploring Auckland’s harbour, city views and West Coast beaches.',
    heroImage: IMAGES.places.viaductHarbour,
    gallery: [
      { src: IMAGES.places.aucklandDomain, title: 'Auckland Domain & Museum', desc: 'Enjoy stunning views and a touch of history.' },
      { src: IMAGES.places.skyTower, title: 'Sky Tower', desc: 'Panoramic views of the city and harbour.' },
      { src: IMAGES.places.viaductHarbour, title: 'Viaduct Harbour', desc: 'Stroll the vibrant waterfront.' },
      { src: IMAGES.places.westAucklandWineries, title: 'West Auckland Wineries', desc: 'Boutique wineries for tastings and views.' },
      { src: IMAGES.places.pihaBeach, title: 'Piha Beach', desc: 'Rugged black sand beaches and lookout points.' },
    ],
    itinerary: [
      { time: '9:00 AM', title: 'Hotel Pick-up', desc: 'Your chauffeur will greet you and begin your journey in comfort.' },
      { time: '9:30 AM', title: 'Auckland Domain & Museum', desc: 'Enjoy stunning views and a touch of history.' },
      { time: '10:30 AM', title: 'Sky Tower', desc: 'Take in panoramic views of the city and harbour.' },
      { time: '12:00 PM', title: 'Viaduct Harbour & Waterfront', desc: 'Stroll, relax and enjoy the vibrant waterfront.' },
      { time: '1:30 PM', title: 'Lunch at a Local Favourite', desc: 'Savour local cuisine at a handpicked venue.' },
      { time: '3:00 PM', title: 'West Auckland Wineries', desc: 'Visit boutique wineries for tastings and views.' },
      { time: '4:30 PM', title: 'Piha Beach & Scenic Lookout', desc: 'Experience rugged black sand beaches and breathtaking lookout points.' },
      { time: '6:00 PM', title: 'Return to Your Destination', desc: 'Relax as we return you in comfort.' },
    ],
  },
  {
    slug: 'waiheke-island-day-tour',
    region: 'north',
    title: 'Waiheke Island Day Tour',
    shortDesc: 'Vineyards, beaches and art on Auckland’s favourite island escape.',
    heroImage: IMAGES.places.waihekeIsland,
    gallery: [
      { src: IMAGES.places.waihekeIsland, title: 'Waiheke Island', desc: 'A short ferry ride to boutique vineyards and beaches.' },
      { src: IMAGES.places.westAucklandWineries, title: 'Vineyard Tasting', desc: 'Sample wines at a leading island vineyard.' },
      { src: IMAGES.fleet.van1, title: 'Your Ride for the Day', desc: 'Travel between stops in comfort.' },
    ],
    itinerary: [
      { time: '8:30 AM', title: 'Hotel Pick-up', desc: 'Your chauffeur collects you for the drive to the ferry terminal.' },
      { time: '9:30 AM', title: 'Ferry to Waiheke Island', desc: 'A scenic harbour crossing to the island.' },
      { time: '10:30 AM', title: 'Vineyard Tour & Tasting', desc: 'Sample boutique wines at a leading Waiheke vineyard.' },
      { time: '12:30 PM', title: 'Lunch at a Winery Restaurant', desc: 'Dine with views across the vines.' },
      { time: '2:00 PM', title: 'Onetangi Beach', desc: 'Relax on one of the island’s best beaches.' },
      { time: '3:30 PM', title: 'Local Art Galleries', desc: 'Browse the island’s boutique galleries and studios.' },
      { time: '5:00 PM', title: 'Return Ferry & Drop-off', desc: 'Relax as we return you in comfort.' },
    ],
  },
  {
    slug: 'hobbiton-movie-set-day-tour',
    region: 'north',
    title: 'Hobbiton Movie Set Day Tour',
    shortDesc: 'Step into Middle-earth with a guided tour of the Hobbiton Movie Set.',
    heroImage: IMAGES.places.hobbiton,
    gallery: [
      { src: IMAGES.places.hobbiton, title: 'Hobbiton Movie Set', desc: 'Explore the iconic Shire film set.' },
      { src: IMAGES.places.hobbitonAlt, title: 'The Green Dragon Inn', desc: 'A complimentary drink at the famous inn.' },
      { src: IMAGES.fleet.suv1, title: 'Your Ride for the Day', desc: 'A comfortable scenic drive through the Waikato.' },
    ],
    itinerary: [
      { time: '8:00 AM', title: 'Hotel Pick-up', desc: 'Your chauffeur will greet you and begin your journey in comfort.' },
      { time: '9:30 AM', title: 'Drive to Matamata', desc: 'A comfortable scenic drive through the Waikato countryside.' },
      { time: '11:00 AM', title: 'Hobbiton Movie Set Guided Tour', desc: 'Explore the iconic Shire film set with an expert guide.' },
      { time: '1:00 PM', title: 'Drink at the Green Dragon Inn', desc: 'Enjoy a complimentary beverage at the famous inn.' },
      { time: '1:30 PM', title: 'Lunch', desc: 'A relaxed lunch nearby before the return journey.' },
      { time: '4:30 PM', title: 'Return Drive', desc: 'Relax as we return you in comfort.' },
    ],
  },
  {
    slug: 'waitomo-caves-day-tour',
    region: 'north',
    title: 'Waitomo Caves Day Tour',
    shortDesc: 'Discover the glowworm-lit underground world of Waitomo.',
    heroImage: IMAGES.places.waitomoCaves,
    gallery: [
      { src: IMAGES.places.waitomoCaves, title: 'Glowworm Caves', desc: 'A guided boat tour beneath thousands of glowworms.' },
      { src: IMAGES.places.waitomoCavesAlt, title: 'Waitomo Caverns', desc: 'Underground limestone formations up close.' },
      { src: IMAGES.fleet.sedan1, title: 'Your Ride for the Day', desc: 'A scenic drive south through the Waikato.' },
    ],
    itinerary: [
      { time: '8:00 AM', title: 'Hotel Pick-up', desc: 'Your chauffeur will greet you and begin your journey in comfort.' },
      { time: '10:00 AM', title: 'Drive to Waitomo', desc: 'A scenic drive south through the Waikato.' },
      { time: '11:00 AM', title: 'Glowworm Caves Tour', desc: 'A guided boat tour beneath thousands of glowworms.' },
      { time: '1:00 PM', title: 'Lunch', desc: 'A relaxed lunch in Waitomo village.' },
      { time: '2:30 PM', title: 'Black Water Rafting (Optional)', desc: 'An optional underground adventure for the more adventurous.' },
      { time: '4:30 PM', title: 'Return Drive', desc: 'Relax as we return you in comfort.' },
    ],
  },
  {
    slug: 'rotorua-waitomo-day-tour',
    region: 'north',
    title: 'Rotorua & Waitomo Day Tour',
    shortDesc: 'Combine geothermal wonders with the glowworm caves in one big day.',
    heroImage: IMAGES.places.rotoruaGeothermal,
    gallery: [
      { src: IMAGES.places.waitomoCaves, title: 'Waitomo Glowworm Caves', desc: 'A guided boat tour beneath thousands of glowworms.' },
      { src: IMAGES.places.rotoruaGeothermal, title: 'Rotorua Geothermal Park', desc: 'Geysers, mud pools and geothermal wonders.' },
      { src: IMAGES.fleet.van1, title: 'Your Ride for the Day', desc: 'Comfortable travel between both regions.' },
    ],
    itinerary: [
      { time: '7:30 AM', title: 'Hotel Pick-up', desc: 'An early start for a full day of sightseeing.' },
      { time: '9:30 AM', title: 'Waitomo Glowworm Caves', desc: 'A guided boat tour beneath thousands of glowworms.' },
      { time: '12:00 PM', title: 'Lunch', desc: 'A relaxed lunch en route to Rotorua.' },
      { time: '2:00 PM', title: 'Rotorua Geothermal Park', desc: 'Geysers, mud pools and geothermal wonders.' },
      { time: '4:00 PM', title: 'Te Puia', desc: 'Cultural performance and geothermal valley walk.' },
      { time: '6:30 PM', title: 'Return Drive', desc: 'Relax as we return you in comfort.' },
    ],
  },
  {
    slug: 'hobbiton-waitomo-day-tour',
    region: 'north',
    title: 'Hobbiton & Waitomo Day Tour',
    shortDesc: 'Middle-earth and glowworm caves combined in one unforgettable day.',
    heroImage: IMAGES.places.hobbitonAlt,
    gallery: [
      { src: IMAGES.places.hobbitonAlt, title: 'Hobbiton Movie Set', desc: 'Explore the iconic Shire film set.' },
      { src: IMAGES.places.hobbiton, title: 'The Shire', desc: 'Iconic hobbit holes and rolling green hills.' },
      { src: IMAGES.places.waitomoCaves, title: 'Waitomo Glowworm Caves', desc: 'A guided boat tour beneath thousands of glowworms.' },
    ],
    itinerary: [
      { time: '7:30 AM', title: 'Hotel Pick-up', desc: 'Your chauffeur will greet you and begin your journey in comfort.' },
      { time: '9:00 AM', title: 'Hobbiton Movie Set Tour', desc: 'Explore the iconic Shire film set with an expert guide.' },
      { time: '11:30 AM', title: 'Lunch', desc: 'A relaxed lunch before continuing south.' },
      { time: '1:30 PM', title: 'Waitomo Glowworm Caves', desc: 'A guided boat tour beneath thousands of glowworms.' },
      { time: '4:00 PM', title: 'Return Drive', desc: 'Relax as we return you in comfort.' },
    ],
  },
  {
    slug: 'rotorua-day-tour',
    region: 'north',
    title: 'Rotorua Day Tour',
    shortDesc: 'Geothermal wonders, culture and forest views in New Zealand’s adventure capital of the north.',
    heroImage: IMAGES.places.rotoruaGeothermal,
    gallery: [
      { src: IMAGES.places.rotoruaGeothermal, title: 'Te Puia Geothermal Reserve', desc: 'Geysers, mud pools and the Pohutu Geyser.' },
      { src: IMAGES.fleet.suv2, title: 'Your Ride for the Day', desc: 'Comfortable travel between every stop.' },
      { src: IMAGES.fleet.sedan2, title: 'Skyline Gondola', desc: 'Ride to the summit for views across the lakes.' },
    ],
    itinerary: [
      { time: '8:00 AM', title: 'Hotel Pick-up', desc: 'Your chauffeur will greet you and begin your journey in comfort.' },
      { time: '10:00 AM', title: 'Te Puia Geothermal Reserve', desc: 'Geysers, mud pools and the Pohutu Geyser.' },
      { time: '11:30 AM', title: 'Māori Cultural Show', desc: 'A traditional performance and cultural welcome.' },
      { time: '1:00 PM', title: 'Lunch', desc: 'A relaxed lunch in Rotorua town.' },
      { time: '2:30 PM', title: 'Skyline Gondola', desc: 'Ride to the summit for views across the lakes.' },
      { time: '4:00 PM', title: 'Redwoods Forest Walk', desc: 'A peaceful walk among towering redwood trees.' },
      { time: '5:30 PM', title: 'Return Drive', desc: 'Relax as we return you in comfort.' },
    ],
  },
  {
    slug: 'bay-of-islands-paihia-day-tour',
    region: 'north',
    title: 'Bay of Islands (Paihia) Day Tour',
    shortDesc: 'History, waterfront charm and island cruising in the beautiful Bay of Islands.',
    heroImage: IMAGES.places.bayOfIslands,
    gallery: [
      { src: '/images/tours/paihia/1-bay-of-islands.jpg', title: 'Bay of Islands', desc: 'A scenic cruise through the islands of the bay.' },
      { src: '/images/tours/paihia/2-paihia-beach.jpg', title: 'Paihia Beach', desc: 'Stroll the waterfront and harbour views.' },
      { src: '/images/tours/paihia/3-dolphin-cruise.jpg', title: 'Dolphin & Island Cruise', desc: 'A scenic cruise through the islands of the bay, watching for dolphins.' },
    ],
    itinerary: [
      { time: '7:00 AM', title: 'Hotel Pick-up', desc: 'An early start for the drive north.' },
      { time: '10:00 AM', title: 'Waitangi Treaty Grounds', desc: 'Explore the birthplace of modern New Zealand.' },
      { time: '11:30 AM', title: 'Paihia Waterfront', desc: 'Stroll the waterfront and harbour views.' },
      { time: '12:30 PM', title: 'Lunch', desc: 'A relaxed lunch overlooking the bay.' },
      { time: '2:00 PM', title: 'Dolphin & Island Cruise', desc: 'A scenic cruise through the islands of the bay.' },
      { time: '4:00 PM', title: 'Kerikeri', desc: 'Visit New Zealand’s oldest stone building and historic sites.' },
      { time: '6:30 PM', title: 'Return Drive', desc: 'Relax as we return you in comfort.' },
    ],
  },

  // ---- South Island ----
  {
    slug: 'queenstown-day-tour',
    region: 'south',
    title: 'Queenstown Day Tour',
    shortDesc: 'Alpine views, historic villages and lakeside adventure in Queenstown.',
    heroImage: IMAGES.places.queenstown,
    gallery: [
      { src: IMAGES.places.queenstown, title: 'Lake Wakatipu', desc: 'A scenic cruise on one of New Zealand’s most beautiful lakes.' },
      { src: IMAGES.places.queenstownAlt, title: 'Skyline Gondola', desc: 'Sweeping alpine views above Queenstown.' },
      { src: '/images/tours/queenstown/2-arrowtown.jpg', title: 'Arrowtown', desc: 'A beautifully preserved gold-mining village.' },
    ],
    itinerary: [
      { time: '9:00 AM', title: 'Hotel Pick-up', desc: 'Your chauffeur will greet you and begin your journey in comfort.' },
      { time: '9:30 AM', title: 'Skyline Gondola', desc: 'Ride high above Queenstown for sweeping alpine views.' },
      { time: '11:00 AM', title: 'Lake Wakatipu Cruise', desc: 'A scenic cruise on one of New Zealand’s most beautiful lakes.' },
      { time: '1:00 PM', title: 'Lunch', desc: 'A relaxed lunch overlooking the lake.' },
      { time: '2:30 PM', title: 'Arrowtown Historic Village', desc: 'Explore this beautifully preserved gold-mining village.' },
      { time: '4:00 PM', title: 'Shotover Jet (Optional)', desc: 'An optional high-speed jet boat thrill ride.' },
      { time: '5:30 PM', title: 'Return to Your Destination', desc: 'Relax as we return you in comfort.' },
    ],
  },
  {
    slug: 'christchurch-day-tour',
    region: 'south',
    title: 'Christchurch Day Tour',
    shortDesc: 'Gardens, heritage and the Garden City’s riverside charm.',
    heroImage: IMAGES.places.christchurch,
    gallery: [
      { src: '/images/tours/christchurch/1-cathedral-square.jpg', title: 'Cathedral Square', desc: 'The historic heart of the city, where the vintage tram still loops through.' },
      { src: '/images/tours/christchurch/3-botanic-gardens.jpg', title: 'Botanic Gardens', desc: 'Blossoms at Hagley Park, right by one of the country’s finest botanic gardens.' },
      { src: '/images/tours/christchurch/2-arts-centre.jpg', title: 'The Arts Centre', desc: 'A beautifully restored heritage precinct of galleries, shops and eateries.' },
    ],
    itinerary: [
      { time: '9:00 AM', title: 'Hotel Pick-up', desc: 'Your chauffeur will greet you and begin your journey in comfort.' },
      { time: '9:30 AM', title: 'Botanic Gardens', desc: 'Stroll through one of the country’s finest botanic gardens.' },
      { time: '11:00 AM', title: 'Cathedral Square', desc: 'The historic heart of the city.' },
      { time: '12:00 PM', title: 'Punting on the Avon', desc: 'A relaxed punt along the gentle Avon River.' },
      { time: '1:00 PM', title: 'Lunch', desc: 'A relaxed lunch in the city centre.' },
      { time: '2:30 PM', title: 'International Antarctic Centre', desc: 'An immersive look at life in Antarctica.' },
      { time: '4:30 PM', title: 'Return to Your Destination', desc: 'Relax as we return you in comfort.' },
    ],
  },
  {
    slug: 'milford-sound-scenic-day-tour',
    region: 'south',
    title: 'Milford Sound Scenic Day Tour',
    shortDesc: 'One of the world’s most spectacular fiords, in absolute comfort.',
    heroImage: IMAGES.places.milfordSound,
    gallery: [
      { src: IMAGES.places.milfordSound, title: 'Milford Sound Cruise', desc: 'Beneath towering fiord walls and waterfalls.' },
      { src: IMAGES.places.milfordSoundAlt, title: 'Milford Road', desc: 'One of the most beautiful drives in the world.' },
      { src: IMAGES.fleet.suv2, title: 'Mirror Lakes', desc: 'A photo stop at the famous reflective lakes.' },
    ],
    itinerary: [
      { time: '7:00 AM', title: 'Hotel Pick-up', desc: 'An early start for the scenic drive south.' },
      { time: '9:00 AM', title: 'Te Anau', desc: 'A stop at the gateway to Fiordland.' },
      { time: '10:00 AM', title: 'Milford Road Scenic Drive', desc: 'One of the most beautiful drives in the world.' },
      { time: '12:00 PM', title: 'Milford Sound Cruise', desc: 'A scenic cruise beneath towering fiord walls and waterfalls.' },
      { time: '1:30 PM', title: 'Lunch Onboard', desc: 'Lunch with a view as you cruise the fiord.' },
      { time: '3:30 PM', title: 'Mirror Lakes', desc: 'A photo stop at the famous reflective lakes.' },
      { time: '6:30 PM', title: 'Return to Your Destination', desc: 'Relax as we return you in comfort.' },
    ],
  },
]

export function getTourBySlug(slug) {
  return TOURS.find((t) => t.slug === slug)
}

export const NORTH_ISLAND_TOURS = TOURS.filter((t) => t.region === 'north')
export const SOUTH_ISLAND_TOURS = TOURS.filter((t) => t.region === 'south')
