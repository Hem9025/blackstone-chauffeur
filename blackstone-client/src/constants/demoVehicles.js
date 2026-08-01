import { IMAGES } from './images'

// Shown when the API has no vehicles yet (e.g. database not connected/seeded).
// Once real vehicles exist in Postgres, the live API response takes over automatically.
export const DEMO_VEHICLES = [
  {
    id: 'demo-1',
    name: 'Mercedes-Benz S-Class',
    type: 'luxury',
    description: 'Flagship luxury sedan with rear executive seating.',
    capacity: 3,
    price_per_km: 4.8,
    image_url: IMAGES.fleet.sedan1,
  },
  {
    id: 'demo-2',
    name: 'BMW 7 Series',
    type: 'luxury',
    description: 'Refined sedan built for business travel and airport transfers.',
    capacity: 3,
    price_per_km: 4.5,
    image_url: IMAGES.fleet.sedan2,
  },
  {
    id: 'demo-3',
    name: 'Range Rover Autobiography',
    type: 'luxury',
    description: 'Premium SUV with generous space for luggage and passengers.',
    capacity: 4,
    price_per_km: 5.2,
    image_url: IMAGES.fleet.suv1,
  },
  {
    id: 'demo-4',
    name: 'Cadillac Escalade',
    type: 'economy',
    description: 'Spacious SUV, ideal for groups and airport runs.',
    capacity: 6,
    price_per_km: 3.6,
    image_url: IMAGES.fleet.suv2,
  },
  {
    id: 'demo-5',
    name: 'Mercedes-Benz V-Class',
    type: 'economy',
    description: 'Comfortable people-carrier for larger groups and events.',
    capacity: 7,
    price_per_km: 3.2,
    image_url: IMAGES.fleet.van1,
  },
]
