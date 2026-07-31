import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth as authApi } from '../utils/api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'bc_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
