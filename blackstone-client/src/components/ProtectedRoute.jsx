import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Guards a route (or nested <Route> subtree) behind authentication and,
 * optionally, a specific role.
 *
 * Usage:
 *   <Route element={<ProtectedRoute roles={['admin']} />}>
 *     <Route path="/admin" element={<AdminDashboard />} />
 *   </Route>
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()

  if (loading) return null // could render a spinner

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
