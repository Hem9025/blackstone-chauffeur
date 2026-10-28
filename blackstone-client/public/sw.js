// Service worker — exists only to receive web push notifications (and make the
// site installable). It deliberately does NOT cache pages or API responses, so
// it can never serve stale content after a deploy.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// The server sends { title, body, url }. Text is kept generic on the server
// (no names/addresses) because lock screens show it to anyone nearby.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'BlackStone Chauffeur', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'BlackStone Chauffeur'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Open the app to see the details.',
      icon: '/icon-192.png',
      badge: '/favicon.png',
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if (w.url.startsWith(self.location.origin) && 'focus' in w) {
          w.navigate(target).catch(() => {})
          return w.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
