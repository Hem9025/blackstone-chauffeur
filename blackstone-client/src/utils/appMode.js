// "App mode" = the code is running inside the BlackStone phone app (Capacitor
// wrapper) — or in a normal browser with ?app=1 added to the URL, which is how
// the app look is previewed/tested without building the app.
//
// The public website NEVER enters app mode on its own: it only turns on when
// Capacitor injects window.Capacitor (native app) or ?app=1 is used. So the
// website's phone view is untouched. ?app=0 switches the preview back off.

function detect() {
  if (typeof window === 'undefined') return false
  if (window.Capacitor?.isNativePlatform?.()) return true
  try {
    const flag = new URLSearchParams(window.location.search).get('app')
    if (flag === '1') sessionStorage.setItem('bc_app', '1')
    if (flag === '0') sessionStorage.removeItem('bc_app')
    return sessionStorage.getItem('bc_app') === '1'
  } catch {
    return false
  }
}

export const IS_APP = detect()

// True only inside the real installed app (not the ?app=1 browser preview).
export const IS_NATIVE = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()

if (IS_APP && typeof document !== 'undefined') {
  document.documentElement.classList.add('app-mode')
  // Let the app draw under the notch/home bar (safe-area padding handles the
  // rest). Done here, not in index.html, so the website viewport is untouched.
  document.querySelector('meta[name="viewport"]')?.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, viewport-fit=cover',
  )
}
