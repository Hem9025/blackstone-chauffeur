import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router doesn't reset scroll position on navigation (it's a SPA —
// the browser has no page load to reset it for you), so without this,
// clicking a link while scrolled down a long page (e.g. the fleet list)
// lands you on the new page already scrolled down instead of at the top.
// Mounted once near the root, below Routes, so every route change scrolls
// back up automatically.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
