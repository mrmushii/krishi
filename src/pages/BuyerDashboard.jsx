import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getUserTransports, subscribeToActiveTransports } from '../services/transportService'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import TransportMap from '../components/TransportMap'

export default function BuyerDashboard() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [transports, setTransports] = useState([])
  const [showTrackMap, setShowTrackMap] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)

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

  const loadTransports = useCallback(async () => {
    if (!user) return
    try {
      const buyerTransports = await getUserTransports(user.uid, 'buyer')
      setTransports(buyerTransports)

      // Subscribe to real-time updates
      return subscribeToActiveTransports((activeTransports) => {
        setTransports(prev => {
          const updated = [...prev]
          activeTransports.forEach(active => {
            const index = updated.findIndex(t => t.id === active.id)
            if (index >= 0) {
              updated[index] = active
            }
          })
          return updated
        })
      })
    } catch (err) {
      console.error('Error loading transports:', err)
    }
  }, [user])

  useEffect(() => {
    if (isBuyer && !isVerified && !isPending) {
      navigate('/buyer-verification')
      return
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        }
      )
    }
    loadTransports()

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadTransports()
    }, 10000)

    return () => clearInterval(interval)
  }, [isBuyer, isVerified, isPending, navigate, loadTransports])

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

        <div className="bg-white rounded-lg shadow p-6 mb-6">
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

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Transport Tracking</h3>
            <Button onClick={() => setShowTrackMap(!showTrackMap)}>
              {showTrackMap ? 'Hide' : 'Track'} Transport Map
            </Button>
          </div>
          {showTrackMap && (
            <div className="mt-4">
              <TransportMap
                transports={transports.filter(t => t.status === 'in-transit' || t.status === 'assigned')}
                center={currentLocation || { lat: 23.8103, lng: 90.4125 }}
                height="400px"
              />
            </div>
          )}
          {transports.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Active Transports:</p>
              {transports.filter(t => t.status === 'in-transit' || t.status === 'assigned').map(transport => (
                <div key={transport.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  <strong>{transport.goodsType}</strong> - Status: {transport.status}
                  {transport.assignedDriverName && ` | Driver: ${transport.assignedDriverName}`}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
