import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { notifications as notificationsApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const POLL_MS = 20000

// "2m ago" rather than "2 minutes ago" — short and scannable in a dropdown
// list, falling back to a plain date once it's more than a week old.
function relativeTime(dateString) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateString).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })
}

// Roles this is relevant to — customers don't place bookings on anyone
// else's behalf and have nothing else here to be notified about yet.
const ELIGIBLE_ROLES = ['admin', 'second_admin', 'driver', 'provider']

// A bell icon in the navbar for admin/second_admin/driver/provider — polls
// for new bookings, edits, driver assignments, and cancellations relevant
// to whoever's logged in, so opening the site (not just the exact page
// something happened on) is enough to see what's new. Dark-on-light or
// light-on-dark via the `dark` prop, since it sits in the navbar which
// itself switches between a dark bar and a transparent-over-hero one.
export default function NotificationBell({ dark = false, className = '' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [list, setList] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const containerRef = useRef(null)

  const eligible = user && ELIGIBLE_ROLES.includes(user.role)

  function load() {
    notificationsApi
      .list()
      .then((data) => {
        setList(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (!eligible) return
    load()
    const interval = setInterval(load, POLL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!eligible) return null

  async function handleOpen(n) {
    if (!n.is_read) {
      setList((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)))
      setUnreadCount((c) => Math.max(0, c - 1))
      notificationsApi.markRead(n.id).catch(() => {})
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  async function handleMarkAllRead() {
    setList((prev) => prev.map((item) => ({ ...item, is_read: true })))
    setUnreadCount(0)
    notificationsApi.markAllRead().catch(() => {})
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className={`relative flex items-center ${dark ? 'text-brand-white' : 'text-brand-black'} hover:opacity-70`}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold text-brand-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-80 border border-black/10 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
            <p className="font-heading text-sm text-brand-black">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-xs text-brand-gold hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!list.length && <p className="px-4 py-6 text-center text-sm text-brand-black/40">Nothing yet.</p>}
            {list.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleOpen(n)}
                className={`flex w-full flex-col gap-0.5 border-b border-black/5 px-4 py-3 text-left last:border-0 hover:bg-black/[0.03] ${
                  n.is_read ? '' : 'bg-brand-gold/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-brand-black">{n.title}</p>
                  {!n.is_read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />}
                </div>
                {n.message && <p className="text-xs text-brand-black/60">{n.message}</p>}
                <p className="text-[11px] text-brand-black/35">{relativeTime(n.created_at)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
