import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import Navbar from '../components/Navbar'

export default function BuyerDashboard() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {userData?.name || user?.email}</h2>
          <p className="text-gray-600">Browse fresh produce from verified farmers</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => navigate('/marketplace')} className="w-full py-4">
              Explore Marketplace
            </Button>
            <Button variant="outline" onClick={() => navigate('/orders')} className="w-full py-4">
              My Orders
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

