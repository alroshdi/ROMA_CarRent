import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import BookingFlowPage from './pages/BookingFlowPage'
import MyBookingsPage from './pages/MyBookingsPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import ContactPage from './pages/ContactPage'
import AboutPage from './pages/AboutPage'
import BrowseCarsPage from './pages/BrowseCarsPage'
import ProfilePage from './pages/ProfilePage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminCarsPage from './pages/admin/AdminCarsPage'
import AdminDriversPage from './pages/admin/AdminDriversPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

function ProtectedCustomer({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('customer_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/browse" element={<BrowseCarsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/book/:carId" element={<ProtectedCustomer><BookingFlowPage /></ProtectedCustomer>} />
          <Route path="/my-bookings" element={<ProtectedCustomer><MyBookingsPage /></ProtectedCustomer>} />
          <Route path="/profile" element={<ProtectedCustomer><ProfilePage /></ProtectedCustomer>} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="cars" element={<AdminCarsPage />} />
            <Route path="drivers" element={<AdminDriversPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="templates" element={<AdminTemplatesPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
