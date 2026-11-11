import { Suspense, lazy, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import AdminPermissionGate from './components/AdminPermissionGate'
import AppHeader from './components/AppHeader'
import AppTabBar from './components/AppTabBar'
import { IS_APP } from './utils/appMode'

// Only the homepage loads eagerly (it is the most common landing page). Every
// other page is fetched when visited, which keeps the first download small —
// the biggest lever for the mobile PageSpeed score.
import Home from './pages/Home'
const AppWelcome = lazy(() => import('./pages/AppWelcome'))
const AppCustomerHome = lazy(() => import('./pages/AppCustomerHome'))
const AppDriverJobs = lazy(() => import('./pages/AppDriverJobs'))
const AppAdminMore = lazy(() => import('./pages/AppAdminMore'))
const About = lazy(() => import('./pages/About'))
const Services = lazy(() => import('./pages/Services'))
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'))
const Locations = lazy(() => import('./pages/Locations'))
const LocationDetail = lazy(() => import('./pages/LocationDetail'))
const FleetCategory = lazy(() => import('./pages/FleetCategory'))
const FleetDetail = lazy(() => import('./pages/FleetDetail'))
const Tour = lazy(() => import('./pages/Tour'))
const TourDetail = lazy(() => import('./pages/TourDetail'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Contact = lazy(() => import('./pages/Contact'))
const Booking = lazy(() => import('./pages/Booking'))
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'))
const PrivacyPolicy = lazy(() => import('./pages/Privacy'))
const TermsConditions = lazy(() => import('./pages/TermsConditions'))

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

  // gtag's own config call only fires a page_view once, on the very first
  // load — client-side route changes after that are invisible to GA4 unless
  // we tell it explicitly. That's why Realtime only ever showed "/". This
  // sends one on every route change; the initial load is skipped here since
  // the config call in index.html already covers it (avoids double-counting
  // the landing page).
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      })
    }
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      {/* Phone app gets its own slim header + bottom tabs; the website keeps
          the normal Navbar. IS_APP is false on the website, always. */}
      {IS_APP ? <AppHeader /> : <Navbar />}

      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={IS_APP ? <AppWelcome /> : <Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/locations/:slug" element={<LocationDetail />} />
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
            <Route path="/dashboard" element={IS_APP ? <AppCustomerHome /> : <CustomerDashboard />} />
          </Route>

          {/* Driver */}
          <Route element={<ProtectedRoute roles={['driver']} />}>
            <Route path="/driver" element={IS_APP ? <AppDriverJobs /> : <DriverDashboard />} />
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
              <Route path="/admin/more" element={<AppAdminMore />} />
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

      {IS_APP ? <AppTabBar /> : !isAccountRoute && <Footer />}
    </div>
  )
}

export default App
