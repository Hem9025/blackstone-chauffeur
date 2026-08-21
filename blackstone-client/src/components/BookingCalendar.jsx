import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const STATUS_DOT = {
  pending: 'bg-amber-400',
  assigned: 'bg-blue-400',
  en_route: 'bg-indigo-500',
  arrived: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-400',
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// Builds a 6-week (42-day) grid for the given month, starting on Monday.
function buildMonthGrid(viewDate) {
  const first = startOfMonth(viewDate)
  const mondayOffset = (first.getDay() + 6) % 7 // 0 = Monday
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - mondayOffset)

  const days = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    days.push(d)
  }
  return days
}

/**
 * Month-view calendar of bookings — no external calendar library, just a
 * plain date grid. Each day shows up to 3 status-coloured pills (time +
 * short label); clicking a day calls onSelectDate with that Date.
 */
export default function BookingCalendar({ bookings, selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date())

  const days = useMemo(() => buildMonthGrid(viewDate), [viewDate])
  const today = new Date()

  function bookingsOn(day) {
    return bookings.filter((b) => b.date && sameDay(new Date(b.date), day))
  }

  return (
    <div className="border border-brand-black/10 bg-white">
      <div className="flex items-center justify-between border-b border-brand-black/10 px-4 py-3">
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          className="p-1 text-brand-black/50 hover:text-brand-black"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-heading text-base text-brand-black">
          {viewDate.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate(new Date())}
            className="text-xs text-brand-gold hover:underline"
          >
            Today
          </button>
          <button
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
            className="p-1 text-brand-black/50 hover:text-brand-black"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-brand-black/10 text-center text-xs uppercase tracking-wide text-brand-black/40">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = day.getMonth() === viewDate.getMonth()
          const dayBookings = bookingsOn(day)
          const isSelected = selectedDate && sameDay(day, selectedDate)
          const isToday = sameDay(day, today)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`flex min-h-[92px] flex-col items-start gap-1 border-b border-r border-brand-black/5 p-1.5 text-left transition-colors last:border-r-0 ${
                inMonth ? 'bg-white' : 'bg-black/[0.015]'
              } ${isSelected ? 'ring-2 ring-inset ring-brand-gold' : 'hover:bg-black/[0.02]'}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday ? 'bg-brand-gold text-brand-black' : inMonth ? 'text-brand-black' : 'text-brand-black/30'
                }`}
              >
                {day.getDate()}
              </span>
              <div className="flex w-full flex-col gap-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <span key={b.id} className="flex items-center gap-1 truncate text-[10px] text-brand-black/70">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[b.booking_status] || 'bg-brand-black/30'}`} />
                    <span className="truncate">{b.time ? String(b.time).slice(0, 5) : '--:--'} {b.pickup || 'Pickup TBC'}</span>
                  </span>
                ))}
                {dayBookings.length > 3 && (
                  <span className="text-[10px] text-brand-black/40">+{dayBookings.length - 3} more</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
