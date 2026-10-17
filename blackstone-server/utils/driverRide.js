// Everything a driver needs to know about a ride, in one place — shared by
// the "ride assigned" email and the driver dashboard so both always show the
// same thing.
import { query } from '../db/index.js'

// Columns safe to show a driver. Deliberately an explicit list instead of
// `SELECT b.*` so customer-facing money (total_price, discounts, Stripe ids,
// provider_price) never reaches a driver's browser — only driver_price,
// which is the driver's own pay for this ride.
export const DRIVER_RIDE_COLUMNS = `
  b.id, b.date, b.time, b.pickup, b.dropoff, b.trip_type, b.service_type, b.hours,
  b.flight_number, b.stops, b.stop_addresses, b.child_seats, b.passengers, b.suitcases,
  b.notes, b.reference, b.driver_price, b.booking_status, b.distance_km, b.duration_min,
  b.passenger_name, b.passenger_phone, b.passenger_email,
  v.name AS vehicle_name,
  c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email`

const DRIVER_RIDE_JOINS = `
  FROM bookings b
  LEFT JOIN vehicles v ON v.id = b.vehicle_id
  LEFT JOIN users c ON c.id = b.customer_id`

export async function loadDriverRides(driverId) {
  const { rows } = await query(
    `SELECT ${DRIVER_RIDE_COLUMNS} ${DRIVER_RIDE_JOINS}
     WHERE b.driver_id = ? ORDER BY b.date, b.time`,
    [driverId],
  )
  return rows
}

// Row with the driver's own name/email too — for building the email.
export async function loadRideForAssignmentEmail(bookingId) {
  const { rows } = await query(
    `SELECT ${DRIVER_RIDE_COLUMNS}, d.name AS driver_name, d.email AS driver_email
     ${DRIVER_RIDE_JOINS}
     LEFT JOIN users d ON d.id = b.driver_id
     WHERE b.id = ?`,
    [bookingId],
  )
  return rows[0] || null
}

function parseStops(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

// Maps a row from the queries above to the props bookingAssignedTemplate
// takes. Contact details fall back to the account holder's when the booking
// has no separate passenger (an ordinary customer booking, where the
// customer IS the passenger) — a provider booking keeps its own passenger
// details, since the account holder there is the agent, not the rider.
export function rideEmailProps(ride) {
  return {
    driverName: ride.driver_name,
    pickup: ride.pickup,
    dropoff: ride.dropoff,
    date: ride.date,
    time: ride.time ? String(ride.time).slice(0, 5) : ride.time,
    passengerName: ride.passenger_name || ride.customer_name,
    passengerPhone: ride.passenger_phone || ride.customer_phone,
    passengerEmail: ride.passenger_email || ride.customer_email,
    vehicleName: ride.vehicle_name,
    passengers: ride.passengers,
    suitcases: ride.suitcases,
    childSeats: ride.child_seats,
    flightNumber: ride.flight_number,
    hours: ride.hours,
    stopAddresses: parseStops(ride.stop_addresses),
    notes: ride.notes,
  }
}
