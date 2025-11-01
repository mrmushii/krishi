import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'
import Button from '../components/Button'
import Navbar from '../components/Navbar'

export default function BuyerDashboard() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (userData?.role === 'buyer' && !userData?.verified && userData?.status !== 'pending_verification') {
      navigate('/buyer-verification')
    }
  }, [userData, navigate])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {userData?.name || user?.email}</h2>
          <p className="text-gray-600">Browse fresh produce from verified farmers</p>
          {!userData?.verified && userData?.status === 'pending_verification' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Your verification is pending. You can browse but cannot make purchases until verified.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={() => navigate('/marketplace')} className="w-full py-4">
              Explore Marketplace
            </Button>
            <Button variant="outline" onClick={() => navigate('/orders')} className="w-full py-4">
              My Orders
            </Button>
            <Button variant="outline" onClick={() => navigate('/cart')} className="w-full py-4">
              Shopping Cart
            </Button>
            <Button variant="outline" onClick={() => navigate('/ledger')} className="w-full py-4">
              My Ledger
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

