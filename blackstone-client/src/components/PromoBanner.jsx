import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { banner as bannerApi } from '../utils/api'

// Dismissal is keyed off the banner's own updated_at rather than a fixed
// key — dismissing hides *this* banner for the rest of the tab session
// (sessionStorage, same convention as the booking draft elsewhere in the
// app), but the moment admin edits the message/link/active state again,
// updated_at changes and it reappears for everyone, including someone who'd
// previously dismissed the old one.
const DISMISS_KEY = 'bc_banner_dismissed_at'

export default function PromoBanner() {
  const [banner, setBanner] = useState(null)
  const [dismissedAt, setDismissedAt] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY)
    } catch {
      return null
    }
  })

  useEffect(() => {
    bannerApi.get().then(setBanner).catch(() => setBanner(null))
  }, [])

  if (!banner || !banner.active || !banner.message) return null
  if (dismissedAt && dismissedAt === String(banner.updated_at)) return null

  function dismiss() {
    setDismissedAt(String(banner.updated_at))
    try {
      sessionStorage.setItem(DISMISS_KEY, String(banner.updated_at))
    } catch {
      // sessionStorage unavailable — banner just won't stay dismissed across
      // navigation within the tab, not worth surfacing an error for.
    }
  }

  return (
    <div className="relative flex items-center justify-center gap-x-3 gap-y-1 bg-brand-gold px-10 py-2.5 text-center text-sm font-medium text-brand-black">
      <span>{banner.message}</span>
      {banner.link_url && (
        <a
          href={banner.link_url}
          target={banner.link_url.startsWith('/') ? undefined : '_blank'}
          rel={banner.link_url.startsWith('/') ? undefined : 'noreferrer'}
          className="underline underline-offset-2 hover:no-underline"
        >
          {banner.link_label || 'Learn more'}
        </a>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/50 hover:text-brand-black"
      >
        <X size={16} />
      </button>
    </div>
  )
}
