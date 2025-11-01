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

function App() {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  return (
    <Router>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/" element={!user ? <Landing /> : <Navigate to={userData?.role === 'farmer' ? '/farmer' : userData?.role === 'buyer' ? '/buyer' : '/agent'} />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={userData?.role === 'farmer' ? '/farmer' : userData?.role === 'buyer' ? '/buyer' : '/agent'} />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to={userData?.role === 'farmer' ? '/farmer' : userData?.role === 'buyer' ? '/buyer' : '/agent'} />} />
        
        {user && userData ? (
          <>
            <Route path="/farmer" element={
              userData.role === 'farmer' ? <FarmerDashboard /> : <Navigate to="/" />
            } />
            <Route path="/buyer" element={
              userData.role === 'buyer' ? <BuyerDashboard /> : <Navigate to="/" />
            } />
            <Route path="/agent" element={
              userData.role === 'agent' ? <AgentDashboard /> : <Navigate to="/" />
            } />
            <Route path="/farmer-payment" element={
              userData.role === 'farmer' && !userData.registrationPaid ? <FarmerPayment /> : <Navigate to="/" />
            } />
            <Route path="/onboarding" element={
              userData.role === 'farmer' && userData.registrationPaid && !userData.verified ? <FarmerOnboarding /> : <Navigate to="/" />
            } />
            <Route path="/buyer-verification" element={
              userData.role === 'buyer' && !userData.verified ? <BuyerVerification /> : <Navigate to="/" />
            } />
            <Route path="/agent/verification" element={
              userData.role === 'agent' ? <AgentVerificationDashboard /> : <Navigate to="/" />
            } />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/rate-farmer/:orderId" element={<RateFarmer />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/ledger" element={<BuyerLedger />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/question/:id" element={<QuestionDetail />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  )
}

export default App

