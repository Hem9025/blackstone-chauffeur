import { useRef } from 'react'
import { Autocomplete } from '@react-google-maps/api'
import { MapPin } from 'lucide-react'

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
