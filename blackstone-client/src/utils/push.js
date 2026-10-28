// Web push helpers. Works on Android Chrome (installed or in a tab) and on
// iPhone only when the site was added to the Home Screen (iOS 16.4+).
import { push as pushApi } from './api'

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function pushPermission() {
  return pushSupported() ? Notification.permission : 'unsupported'
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('SW registration failed', err))
  })
}

// Asks permission (must be called from a click) and saves this device's
// subscription on the server for the logged-in user.
export async function enablePush() {
  if (!pushSupported()) throw new Error('Notifications are not supported on this device. On iPhone, add the site to your Home Screen first.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notifications were blocked. You can allow them in your browser settings.')

  const { publicKey } = await pushApi.publicKey()
  if (!publicKey) throw new Error('Push is not set up on the server yet.')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }
  await pushApi.subscribe(sub.toJSON())
  return true
}

export async function disablePush() {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await pushApi.unsubscribe(sub.endpoint).catch(() => {})
    await sub.unsubscribe()
  }
}

export async function isSubscribed() {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.ready
  return !!(await reg.pushManager.getSubscription())
}
