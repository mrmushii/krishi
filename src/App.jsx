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
import Loading from './components/Loading'

const roleHome = {
  farmer: '/farmer',
  buyer: '/buyer',
  agent: '/agent',
}

function App() {
  const { user, userData, loading } = useAuth()

  if (loading) return <Loading />

  const homePath = user ? roleHome[userData?.role] ?? '/agent' : '/login'

  const restrictedRoutes = [
    { path: '/farmer', element: <FarmerDashboard />, canAccess: () => userData?.role === 'farmer' },
    { path: '/buyer', element: <BuyerDashboard />, canAccess: () => userData?.role === 'buyer' },
    { path: '/agent', element: <AgentDashboard />, canAccess: () => userData?.role === 'agent' },
    {
      path: '/farmer-payment',
      element: <FarmerPayment />,
      canAccess: () => userData?.role === 'farmer' && !userData.registrationPaid,
    },
    {
      path: '/onboarding',
      element: <FarmerOnboarding />,
      canAccess: () =>
        userData?.role === 'farmer' && userData.registrationPaid && !userData.verified,
    },
    {
      path: '/buyer-verification',
      element: <BuyerVerification />,
      canAccess: () => userData?.role === 'buyer' && !userData.verified,
    },
    {
      path: '/agent/verification',
      element: <AgentVerificationDashboard />,
      canAccess: () => userData?.role === 'agent',
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
  ]

  return (
    <Router>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/" element={user ? <Navigate to={homePath} replace /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to={homePath} replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={homePath} replace /> : <Signup />} />

        {user && userData ? (
          <>
            {restrictedRoutes.map(({ path, element, canAccess, redirect }) => (
              <Route
                key={path}
                path={path}
                element={canAccess() ? element : <Navigate to={redirect ?? homePath} replace />}
              />
            ))}

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
