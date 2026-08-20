import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth as authApi } from '../utils/api'

// App-wide login state — who's logged in (if anyone), and the actions that
// change that. Wraps the whole app once in main.jsx; any component reads it
// via useAuth() rather than each page managing its own copy of "who is this."
const AuthContext = createContext(null)

// The JWT itself is the only thing persisted — `user` is always re-derived
// from the server (see loadUser below) rather than cached in localStorage
// alongside it, so a role/status change made by an admin elsewhere is picked
// up on the next page load instead of a stale cached role sticking around.
const TOKEN_KEY = 'bc_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Distinguishes "we haven't checked yet" from "checked, no one's logged
  // in" — every route guard (ProtectedRoute) waits for this before deciding
  // to redirect, so a logged-in user with a valid token never gets bounced
  // to /login for a split second on page refresh while this check is in flight.
  const [loading, setLoading] = useState(true)

  // Re-validates whatever token is in localStorage against the server (GET
  // /api/auth/me) rather than trusting it blindly — an expired or
  // since-revoked token is caught here and cleared, rather than only
  // surfacing as a confusing 401 on the first authenticated request the user
  // happens to make.
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  async function login(credentials) {
    const { token, user: loggedInUser } = await authApi.login(credentials)
    localStorage.setItem(TOKEN_KEY, token)
    setUser(loggedInUser)
    return loggedInUser
  }

  async function register(payload) {
    // Only customer/driver self-registration returns a token immediately
    // (see the SELF_REGISTER_ROLES allowlist server-side) — a driver
    // application starts in 'pending' status, but the server still signs a
    // token for it right away so the applicant can check their status
    // without a separate login step.
    const { token, user: newUser } = await authApi.register(payload)
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
      setUser(newUser)
    }
    return newUser
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// `refresh` (aliased to loadUser above) is exposed so a component can force
// a re-check after something server-side might have changed the logged-in
// user's own record (e.g. a profile edit) without a full page reload.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
