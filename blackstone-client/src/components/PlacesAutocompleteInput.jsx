import { useRef } from 'react'
import { Autocomplete } from '@react-google-maps/api'
import { MapPin } from 'lucide-react'

// Pulls a city/town name out of Google's address_components — tries
// 'locality' first (the usual city field for NZ addresses, including
// Auckland's merged-council suburbs like Māngere), then falls back through
// a couple of looser types for addresses that don't get a locality (rural
// pickups, some regional airports). Used to decide whether a trip is
// bookable instantly or needs an enquiry (see Booking.jsx's tripEligibility).
const CITY_COMPONENT_TYPES = ['locality', 'postal_town', 'administrative_area_level_2', 'sublocality_level_1']

function extractCity(addressComponents) {
  if (!Array.isArray(addressComponents)) return null
  for (const type of CITY_COMPONENT_TYPES) {
    const match = addressComponents.find((c) => c.types.includes(type))
    if (match) return match.long_name
  }
  return null
}

/**
 * A text input backed by Google Places Autocomplete. Requires the Maps JS
 * API (with the "places" library) to already be loaded — pass `isLoaded`
 * from the parent's useJsApiLoader() so this never mounts <Autocomplete>
 * before the script is ready.
 */
export default function PlacesAutocompleteInput({
  isLoaded,
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  className = '',
}) {
  const autocompleteRef = useRef(null)

  function handleLoad(autocomplete) {
    autocompleteRef.current = autocomplete
  }

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace()
    if (!place || !place.geometry) return
    const location = place.geometry.location
    onPlaceSelected({
      address: place.formatted_address || place.name || value,
      lat: location.lat(),
      lng: location.lng(),
      city: extractCity(place.address_components),
    })
  }

  const input = (
    <div className="relative">
      <input
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
      <MapPin size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/30" />
    </div>
  )

  if (!isLoaded) return input

  return (
    <Autocomplete
      onLoad={handleLoad}
      onPlaceChanged={handlePlaceChanged}
      options={{ componentRestrictions: { country: 'nz' } }}
    >
      {input}
    </Autocomplete>
  )
}
