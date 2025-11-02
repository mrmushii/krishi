import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Signup from './pages/Signup'
import FarmerDashboard from './pages/FarmerDashboard'
import BuyerDashboard from './pages/BuyerDashboard'
import AgentDashboard from './pages/AgentDashboard'
import Marketplace from './pages/Marketplace'
import ProductDetail from './pages/ProductDetail'
import FarmerOnboarding from './pages/FarmerOnboarding'
import Orders from './pages/Orders'
import Community from './pages/Community'
import QuestionDetail from './pages/QuestionDetail'
import FarmerPayment from './pages/FarmerPayment'
import BuyerVerification from './pages/BuyerVerification'
import AgentVerificationDashboard from './pages/AgentVerificationDashboard'
import RateFarmer from './pages/RateFarmer'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Wishlist from './pages/Wishlist'
import BuyerLedger from './pages/BuyerLedger'
import Landing from './pages/Landing'
import AdminDashboard from './pages/AdminDashboard'
import DriverDashboard from './pages/DriverDashboard'
import DriverVerification from './pages/DriverVerification'
import Notifications from './pages/Notifications'
import Loading from './components/Loading'

const roleHome = {
  farmer: '/farmer',
  buyer: '/buyer',
  agent: '/agent',
  driver: '/driver',
  admin: '/admin',
}

function App() {
  const { user, userData, loading } = useAuth()

  if (loading) return <Loading />

  // Determine the home path once
  const homePath = user && userData?.role ? roleHome[userData.role] : '/login'

  const restrictedRoutes = [
    { path: '/farmer', element: <FarmerDashboard />, role: 'farmer' },
    { path: '/buyer', element: <BuyerDashboard />, role: 'buyer' },
    { path: '/agent', element: <AgentDashboard />, role: 'agent' },
    { path: '/driver', element: <DriverDashboard />, role: 'driver' },
    { path: '/admin', element: <AdminDashboard />, role: 'admin' },
    {
      path: '/farmer-payment',
      element: <FarmerPayment />,
      canAccess: userData?.role === 'farmer' && !userData.registrationPaid,
    },
    {
      path: '/onboarding',
      element: <FarmerOnboarding />,
      canAccess:
        userData?.role === 'farmer' &&
        userData.registrationPaid &&
        !userData.verified,
    },
    {
      path: '/buyer-verification',
      element: <BuyerVerification />,
      canAccess: userData?.role === 'buyer' && !userData.verified,
    },
    {
      path: '/agent/verification',
      element: <AgentVerificationDashboard />,
      canAccess: userData?.role === 'agent',
    },
    {
      path: '/driver-verification',
      element: <DriverVerification />,
      canAccess: userData?.role === 'driver' && (!userData.verified || userData.driverVerificationStatus !== 'approved'),
    },
  ]

  const sharedRoutes = [
    { path: '/marketplace', element: <Marketplace /> },
    { path: '/product/:id', element: <ProductDetail /> },
    { path: '/orders', element: <Orders /> },
    { path: '/rate-farmer/:orderId', element: <RateFarmer /> },
    { path: '/cart', element: <Cart /> },
    { path: '/checkout', element: <Checkout /> },
    { path: '/wishlist', element: <Wishlist /> },
    { path: '/ledger', element: <BuyerLedger /> },
    { path: '/community', element: <Community /> },
    { path: '/community/question/:id', element: <QuestionDetail /> },
    { path: '/notifications', element: <Notifications /> },
  ]

  // 🔹 Prevent repeated redirects by rendering only once userData is stable
  const shouldRedirectToHome =
    user && userData && !loading && window.location.pathname === '/'

  return (
    <Router>
      <Routes>
        <Route path="/landing" element={<Landing />} />

        {/* Public Routes */}
        <Route
          path="/"
          element={
            shouldRedirectToHome ? (
              <Navigate to={homePath} replace />
            ) : (
              <Landing />
            )
          }
        />
        <Route
          path="/login"
          element={user ? <Navigate to={homePath} replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to={homePath} replace /> : <Signup />}
        />

        {/* Protected Routes */}
        {user && userData ? (
          <>
            {restrictedRoutes.map(({ path, element, role, canAccess }) => {
              const allowed =
                typeof canAccess !== 'undefined'
                  ? canAccess
                  : userData.role === role
              return (
                <Route
                  key={path}
                  path={path}
                  element={allowed ? element : <Navigate to={homePath} replace />}
                />
              )
            })}

            {sharedRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}

            <Route path="*" element={<Navigate to={homePath} replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  )
}

export default App