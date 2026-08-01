import { STATUS_DOT } from './BookingCalendar'

const STATUS_LABELS = {
  pending: 'Pending',
  assigned: 'Assigned',
  en_route: 'En Route',
  arrived: 'Arrived',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// Small colored pill for a booking's ride status — same color mapping as the
// dots in BookingCalendar, so a status means the same thing everywhere
// (driver dashboard, admin table, admin calendar) at a glance.
export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium text-white ${
        STATUS_DOT[status] || 'bg-brand-black/30'
      }`}
    >
      {STATUS_LABELS[status] || status || 'Unknown'}
    </span>
  )
}
