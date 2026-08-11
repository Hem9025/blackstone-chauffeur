import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { permissions as permissionsApi } from '../utils/api'

// 'admin' is always fully permitted regardless of what's actually stored —
// only second_admin's access is ever narrowed by these flags. Mirrors the
// server-side default in db/schema.sql so the UI doesn't flash
// "restricted" while the real fetch is still in flight.
const ADMIN_DEFAULTS = { can_manage_bookings: true, can_manage_vehicles: true, can_manage_users: true, can_view_stats: true }
const SECOND_ADMIN_LOADING_DEFAULTS = { can_manage_bookings: true, can_manage_vehicles: false, can_manage_users: false, can_view_stats: false }

/**
 * Returns { permissions, loading, isAdmin, refresh() } for the current
 * signed-in admin/second_admin. `permissions` is always safe to read even
 * before the fetch resolves — second_admin starts with the same
 * conservative defaults the server ships with, admin starts fully open.
 */
export function useAdminPermissions() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [permissions, setPermissions] = useState(isAdmin ? ADMIN_DEFAULTS : SECOND_ADMIN_LOADING_DEFAULTS)
  const [loading, setLoading] = useState(!isAdmin)

  async function refresh() {
    if (isAdmin) {
      setPermissions(ADMIN_DEFAULTS)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await permissionsApi.get()
      setPermissions({ ...SECOND_ADMIN_LOADING_DEFAULTS, ...data })
    } catch {
      // Fetch failed — stay on the conservative defaults rather than
      // guessing open.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  return { permissions, loading, isAdmin, refresh }
}
