import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import AdminPermissionGate from './components/AdminPermissionGate'

// Public marketing pages load eagerly — this is the content real visitors
// and search engines land on first, so it stays in the main bundle.
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import FleetCategory from './pages/FleetCategory'
import FleetDetail from './pages/FleetDetail'
import Tour from './pages/Tour'
import TourDetail from './pages/TourDetail'
import Gallery from './pages/Gallery'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Contact from './pages/Contact'
import Booking from './pages/Booking'
import BookingSuccess from './pages/BookingSuccess'
import PrivacyPolicy from './pages/Privacy'
import TermsConditions from './pages/TermsConditions'

// Everything below is behind a login (or is the login flow itself) — the
// vast majority of visitors never touch it, so it's split into its own
// chunk(s) and only fetched when someone actually navigates there. This
// keeps the initial JS payload for the marketing site (what PageSpeed and
// most visitors see) meaningfully smaller.
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const DriverApply = lazy(() => import('./pages/DriverApply'))
const Pending = lazy(() => import('./pages/Pending'))

const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'))
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'))
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'))
const SecondAdminDashboard = lazy(() => import('./pages/SecondAdminDashboard'))
const AdminUsersPanel = lazy(() => import('./pages/AdminUsersPanel'))
const AdminVehiclesPanel = lazy(() => import('./pages/AdminVehiclesPanel'))
const AdminDriversPanel = lazy(() => import('./pages/AdminDriversPanel'))
const AdminProvidersPanel = lazy(() => import('./pages/AdminProvidersPanel'))
const AdminPersonDetail = lazy(() => import('./pages/AdminPersonDetail'))
const AdminDashboardPanel = lazy(() => import('./pages/AdminDashboardPanel'))
const AdminSettingsPanel = lazy(() => import('./pages/AdminSettingsPanel'))
const AdminCouponsPanel = lazy(() => import('./pages/AdminCouponsPanel'))
const AdminSubscribersPanel = lazy(() => import('./pages/AdminSubscribersPanel'))
const AdminBlogPanel = lazy(() => import('./pages/AdminBlogPanel'))
const Profile = lazy(() => import('./pages/Profile'))

import NotFound from './pages/NotFound'

// Minimal, brand-neutral loading state for the lazy-loaded routes above —
// shown only for the brief moment their chunk is being fetched.
function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-brand-gold" />
    </div>
  )
}

// Signed-in account areas (customer/driver/provider/admin dashboards +
// profile) run as an "app" rather than the marketing site, so they don't
// carry the marketing footer — it's dead weight below a dashboard and
// pushes actual account content further down the page.
const ACCOUNT_ROUTE_PREFIXES = ['/dashboard', '/driver', '/provider', '/admin', '/profile']

function App() {
  const { pathname } = useLocation()
  const isAccountRoute = ACCOUNT_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />

      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/fleet" element={<Navigate to="/fleet/luxury" replace />} />
          <Route path="/fleet/luxury" element={<FleetCategory category="luxury" />} />
          <Route path="/fleet/comfort" element={<FleetCategory category="economy" />} />
          <Route path="/fleet/:slug" element={<FleetDetail />} />
          <Route path="/tour" element={<Tour />} />
          <Route path="/tour/:slug" element={<TourDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/success" element={<BookingSuccess />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/apply" element={<DriverApply />} />
          <Route path="/pending" element={<Pending />} />

          {/* Any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Customer */}
          <Route element={<ProtectedRoute roles={['customer']} />}>
            <Route path="/dashboard" element={<CustomerDashboard />} />
          </Route>

          {/* Driver */}
          <Route element={<ProtectedRoute roles={['driver']} />}>
            <Route path="/driver" element={<DriverDashboard />} />
          </Route>

          {/* Provider */}
          <Route element={<ProtectedRoute roles={['provider']} />}>
            <Route path="/provider" element={<ProviderDashboard />} />
          </Route>

          {/* Admin / Second Admin — shares one sidebar shell (AdminLayout)
              so every page can jump to any other admin section instantly.
              Users/Vehicles/Stats are reachable by second_admin now too —
              whether they're actually allowed to use them is controlled by
              the main admin (Admin > Second Admin Management) and checked inside each
              panel itself (and, for real enforcement, by the server on
              every request) rather than blocked at the route level. */}
          <Route element={<ProtectedRoute roles={['admin', 'second_admin']} />}>
            <Route element={<AdminLayout />}>
              <Route
                path="/admin/dashboard"
                element={
                  <AdminPermissionGate flag="can_view_stats">
                    <AdminDashboardPanel />
                  </AdminPermissionGate>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminPermissionGate flag="can_manage_bookings">
                    <SecondAdminDashboard />
                  </AdminPermissionGate>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminPermissionGate flag="can_manage_users">
                    <AdminUsersPanel />
                  </AdminPermissionGate>
                }
              />
              <Route
                path="/admin/vehicles"
                element={
                  <AdminPermissionGate flag="can_manage_vehicles">
                    <AdminVehiclesPanel />
                  </AdminPermissionGate>
                }
              />
              <Route
                path="/admin/drivers"
                element={
                  <AdminPermissionGate flag="can_view_stats">
                    <AdminDriversPanel />
                  </AdminPermissionGate>
                }
              />
              <Route
                path="/admin/drivers/:id"
                element={
                  <AdminPermissionGate flag="can_view_stats">
                    <AdminPersonDetail role="driver" />
                  </AdminPermissionGate>
                }
              />
              <Route
                path="/admin/providers"
                element={
                  <AdminPermissionGate flag="can_view_stats">
                    <AdminProvidersPanel />
                  </AdminPermissionGate>
                }
              />
              <Route
                path="/admin/providers/:id"
                element={
                  <AdminPermissionGate flag="can_view_stats">
                    <AdminPersonDetail role="provider" />
                  </AdminPermissionGate>
                }
              />
              <Route
                path="/admin/coupons"
                element={
                  <AdminPermissionGate flag="can_manage_bookings">
                    <AdminCouponsPanel />
                  </AdminPermissionGate>
                }
              />
              <Route
                path="/admin/subscribers"
                element={
                  <AdminPermissionGate flag="can_manage_bookings">
                    <AdminSubscribersPanel />
                  </AdminPermissionGate>
                }
              />
              <Route
                path="/admin/blog"
                element={
                  <AdminPermissionGate flag="can_manage_bookings">
                    <AdminBlogPanel />
                  </AdminPermissionGate>
                }
              />
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin/settings" element={<AdminSettingsPanel />} />
              </Route>
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>

      {!isAccountRoute && <Footer />}
    </div>
  )
}

export default App
