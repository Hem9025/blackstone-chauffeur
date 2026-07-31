import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import LuxuryFleet from './pages/LuxuryFleet'
import PremiumEconomy from './pages/PremiumEconomy'
import Tour from './pages/Tour'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import Booking from './pages/Booking'
import BookingSuccess from './pages/BookingSuccess'

import Login from './pages/Login'
import Register from './pages/Register'
import DriverApply from './pages/DriverApply'
import Pending from './pages/Pending'

import CustomerDashboard from './pages/CustomerDashboard'
import DriverDashboard from './pages/DriverDashboard'
import ProviderDashboard from './pages/ProviderDashboard'
import SecondAdminDashboard from './pages/SecondAdminDashboard'
import AdminUsersPanel from './pages/AdminUsersPanel'

import NotFound from './pages/NotFound'

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/fleet/luxury" element={<LuxuryFleet />} />
          <Route path="/fleet/economy" element={<PremiumEconomy />} />
          <Route path="/tour" element={<Tour />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/success" element={<BookingSuccess />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/apply" element={<DriverApply />} />
          <Route path="/pending" element={<Pending />} />

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

          {/* Admin / Second Admin */}
          <Route element={<ProtectedRoute roles={['admin', 'second_admin']} />}>
            <Route path="/admin" element={<SecondAdminDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/users" element={<AdminUsersPanel />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
