import { useEffect, useState } from 'react'
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api'

const containerStyle = { width: '100%', height: '260px' }
const defaultCenter = { lat: -36.8485, lng: 174.7633 } // Auckland

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
}

/**
 * Renders a small route map between origin/destination (once both are set),
 * optionally routed through one or more waypoints (additional stops, in
 * visit order), and reports the total driving distance/duration back to the
 * parent so it can feed the fare calculation. Requires the Maps JS API to
 * already be loaded.
 */
export default function RouteMap({ isLoaded, origin, destination, waypoints, onRouteCalculated }) {
  const [directions, setDirections] = useState(null)
  const [error, setError] = useState('')

  // Only resolved stops (with lat/lng from the autocomplete) can be routed —
  // a stop the user is still typing has no coordinates yet.
  const resolvedWaypoints = (waypoints || []).filter((w) => w && w.lat != null && w.lng != null)
  const waypointsKey = resolvedWaypoints.map((w) => `${w.lat},${w.lng}`).join('|')

  useEffect(() => {
    if (!isLoaded || !origin || !destination || !window.google) {
      setDirections(null)
      return
    }

    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints: resolvedWaypoints.map((w) => ({ location: { lat: w.lat, lng: w.lng }, stopover: true })),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result)
          setError('')
          // With waypoints, the route has one leg per hop (pickup→stop1,
          // stop1→stop2, …, lastStop→dropoff) — sum all of them for the
          // total trip distance/duration, not just the first leg.
          const legs = result.routes[0]?.legs || []
          if (legs.length) {
            const totalMetres = legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0)
            const totalSeconds = legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0)
            onRouteCalculated?.({
              distanceKm: Math.round(totalMetres / 100) / 10, // metres → km, 1dp
              durationMin: Math.round(totalSeconds / 60),
            })
          }
        } else {
          setDirections(null)
          setError('Could not calculate a route between these locations.')
        }
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, origin?.lat, origin?.lng, destination?.lat, destination?.lng, waypointsKey])

  if (!isLoaded) {
    const hasKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
    return (
      <div className="flex h-[260px] w-full items-center justify-center bg-black/5 px-6 text-center text-sm text-black/40">
        {hasKey ? 'Loading map…' : 'Map preview will appear once a Google Maps API key is configured.'}
      </div>
    )
  }

  return (
    <div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={origin || defaultCenter}
        zoom={origin ? 11 : 10}
        options={mapOptions}
      >
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
      </GoogleMap>
      {error && <p className="bg-red-50 px-4 py-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
