import { IS_NATIVE } from './appMode'
import { api } from './api'

// Push notifications for the installed phone app (Firebase Cloud Messaging).
// Does nothing on the website. If Firebase isn't set up in the native project
// yet (no google-services.json / APNs key), registration simply fails quietly.

let started = false
let currentToken = null

export function startNativePush(navigate) {
  if (!IS_NATIVE || started) return
  const Push = window.Capacitor?.Plugins?.PushNotifications
  if (!Push) return
  started = true

  Push.addListener('registration', async ({ value }) => {
    currentToken = value
    try {
      await api.post('/push/device', { token: value, platform: window.Capacitor.getPlatform?.() })
    } catch {
      // Not signed in yet or offline — retried on next app start.
    }
  })
  Push.addListener('registrationError', () => {})
  Push.addListener('pushNotificationActionPerformed', (event) => {
    const url = event?.notification?.data?.url
    if (url && url.startsWith('/')) navigate(url)
  })

  Push.requestPermissions()
    .then((res) => (res.receive === 'granted' ? Push.register() : null))
    .catch(() => {})
}

// Call before clearing the login so this phone stops getting that user's alerts.
export async function stopNativePush() {
  if (!IS_NATIVE || !currentToken) return
  try {
    await api.post('/push/device/remove', { token: currentToken })
  } catch {
    // ignore
  }
}
