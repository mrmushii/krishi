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
import Loading from './components/Loading'

function App() {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        
        {user && userData ? (
          <>
            <Route path="/" element={
              userData.role === 'farmer' ? <FarmerDashboard /> :
              userData.role === 'buyer' ? <BuyerDashboard /> :
              userData.role === 'agent' ? <AgentDashboard /> :
              <Navigate to="/login" />
            } />
            <Route path="/onboarding" element={
              userData.role === 'farmer' && !userData.verified ? <FarmerOnboarding /> : <Navigate to="/" />
            } />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/orders" element={<Orders />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  )
}

export default App

