import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect, useMemo, useCallback } from 'react'
import Button from '../components/Button'
import Navbar from '../components/Navbar'

export default function BuyerDashboard() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()

  const { isBuyer, isVerified, isPending, displayName } = useMemo(() => {
    const role = userData?.role
    const verified = Boolean(userData?.verified)
    const status = userData?.status
    return {
      isBuyer: role === 'buyer',
      isVerified: verified,
      isPending: status === 'pending_verification',
      displayName: userData?.name || user?.email || 'Buyer',
    }
  }, [userData, user])

  useEffect(() => {
    if (isBuyer && !isVerified && !isPending) {
      navigate('/buyer-verification')
    }
  }, [isBuyer, isVerified, isPending, navigate])

  const goTo = useCallback((path) => () => navigate(path), [navigate])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {displayName}</h2>
          <p className="text-gray-600">Browse fresh produce from verified farmers</p>
          {!isVerified && isPending && (
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
            <Button onClick={goTo('/marketplace')} className="w-full py-4">
              Explore Marketplace
            </Button>
            <Button variant="outline" onClick={goTo('/orders')} className="w-full py-4">
              My Orders
            </Button>
            <Button variant="outline" onClick={goTo('/cart')} className="w-full py-4">
              Shopping Cart
            </Button>
            <Button variant="outline" onClick={goTo('/ledger')} className="w-full py-4">
              My Ledger
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
