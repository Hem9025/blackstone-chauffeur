import { ShieldOff } from 'lucide-react'
import { useAdminPermissions } from '../hooks/useAdminPermissions'

// Wraps an admin panel page — renders it only if the current user (admin,
// always; second_admin, only if the main admin has switched this flag on)
// is actually permitted to see it. Purely a UX nicety: the real boundary is
// server-side (requirePermission.js), so this never has to be perfectly
// airtight, just avoid firing the panel's own data-loading calls (which
// would otherwise just 403) and show something friendlier instead.
export default function AdminPermissionGate({ flag, children }) {
  const { permissions, loading } = useAdminPermissions()

  if (loading) return null

  if (!permissions[flag]) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShieldOff className="mx-auto text-brand-black/25" size={32} />
        <h1 className="mt-4 font-heading text-2xl text-brand-black">Access Restricted</h1>
        <p className="mt-2 text-black/60">
          This section has been restricted by the admin. Get in touch with them if you need access.
        </p>
      </div>
    )
  }

  return children
}
