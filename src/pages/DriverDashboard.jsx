import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import {
  getPendingTransportRequests,
  placeBid,
  getUserTransports,
  updateTransportLocation,
  updateTransportStatus,
  createEmergencyAlert,
  subscribeToTransportLocation
} from '../services/transportService'
import Button from '../components/Button'
import Input from '../components/Input'
import Navbar from '../components/Navbar'
import TransportMap from '../components/TransportMap'

export default function DriverDashboard() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [availableTransports, setAvailableTransports] = useState([])
  const [myTransports, setMyTransports] = useState([])
  const [activeTransport, setActiveTransport] = useState(null)
  const [showTrackMap, setShowTrackMap] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [biddingTransports, setBiddingTransports] = useState({})
  const [locationWatchId, setLocationWatchId] = useState(null)

  
  

  useEffect(() => {
    if (!userData) return;

    // Example 1: Redirect non-drivers
    if (userData.role !== 'driver') {
      navigate('/');
      return;
    }

    // Example 2: Redirect approved drivers
    if (userData.driverVerificationStatus === 'approved') {
      navigate('/driver-dashboard');
      return;
    }
  }, [userData, navigate]);


  const loadData = useCallback(async () => {
    try {
      // Load pending transport requests
      const transports = await getPendingTransportRequests(currentLocation)
      setAvailableTransports(transports)

      // Load my assigned transports
      const myTrans = await getUserTransports(user.uid, 'driver')
      setMyTransports(myTrans)

      // Find active transport
      const active = myTrans.find(t => t.status === 'in-transit' || t.status === 'assigned')
      if (active) {
        setActiveTransport(active)
        // Subscribe to location updates
        subscribeToTransportLocation(active.id, (transport) => {
          setActiveTransport(transport)
        })
      }
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }, [user, currentLocation])

  const startLocationTracking = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setCurrentLocation(location)

          // Update transport location if active
          if (activeTransport && activeTransport.status === 'in-transit') {
            updateTransportLocation(activeTransport.id, location, user.uid).catch(console.error)
          }
        },
        (error) => {
          console.error('Error tracking location:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000
        }
      )

      setLocationWatchId(watchId)
    }
  }, [activeTransport, user])

  const handlePlaceBid = useCallback(async (transportId, bidAmount) => {
    try {
      await placeBid(transportId, user.uid, bidAmount, userData)
      alert('Bid placed successfully!')
      loadData()
    } catch (err) {
      alert('Error placing bid: ' + err.message)
    }
  }, [user, userData, loadData])

  const handleStartTransport = useCallback(async (transportId) => {
    try {
      await updateTransportStatus(transportId, 'in-transit', {
        startedAt: Timestamp.now()
      })
      alert('Transport started! Location tracking is now active.')
      loadData()
    } catch (err) {
      alert('Error starting transport: ' + err.message)
    }
  }, [loadData])

  const handleCompleteTransport = useCallback(async (transportId) => {
    try {
      await updateTransportStatus(transportId, 'delivered', {
        deliveredAt: Timestamp.now()
      })
      alert('Transport marked as delivered!')
      loadData()
    } catch (err) {
      alert('Error completing transport: ' + err.message)
    }
  }, [loadData])

  const handleEmergencyAlert = useCallback(async (transportId) => {
    const issueType = prompt('Issue type (accident, delay, damage, other):')
    if (!issueType) return

    const description = prompt('Describe the issue:')
    if (!description) return

    try {
      await createEmergencyAlert(transportId, issueType, description, currentLocation, user.uid)
      alert('Emergency alert sent!')
    } catch (err) {
      alert('Error sending alert: ' + err.message)
    }
  }, [currentLocation, user])

  // Auto-refresh available transports every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (userData?.role === 'driver' && userData?.verified) {
        loadData()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [userData, loadData])

  if (!userData || userData.role !== 'driver') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {userData?.name || user?.email}</h2>
          <p className="text-gray-600">Vehicle: {userData?.vehicleNumber || 'N/A'}</p>
          {userData?.verified && (
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm mt-2">
              ✓ Verified Driver
            </span>
          )}
        </div>

        <div className="mb-6">
          <Button onClick={() => setShowTrackMap(!showTrackMap)}>
            {showTrackMap ? 'Hide' : 'Track'} Transport Map
          </Button>
        </div>

        {showTrackMap && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Live Transport Tracking</h3>
            <TransportMap 
              transports={myTransports.filter(t => t.status === 'in-transit' || t.status === 'assigned')}
              center={currentLocation || { lat: 23.8103, lng: 90.4125 }}
              height="400px"
            />
          </div>
        )}

        {activeTransport && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2">Active Transport</h3>
            <p><strong>Goods:</strong> {activeTransport.goodsType}</p>
            <p><strong>Destination:</strong> {activeTransport.destination}</p>
            <p><strong>Status:</strong> {activeTransport.status}</p>
            <div className="mt-4 flex gap-2">
              {activeTransport.status === 'assigned' && (
                <Button onClick={() => handleStartTransport(activeTransport.id)}>
                  Start Transport
                </Button>
              )}
              {activeTransport.status === 'in-transit' && (
                <>
                  <Button onClick={() => handleCompleteTransport(activeTransport.id)}>
                    Mark as Delivered
                  </Button>
                  <Button variant="danger" onClick={() => handleEmergencyAlert(activeTransport.id)}>
                    🚨 Emergency Alert
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Transport Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Available Transport Requests</h3>
            {availableTransports.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No available transport requests</p>
            ) : (
              <div className="space-y-4">
                {availableTransports.map(transport => {
                  const biddingEndTime = transport.biddingEndTime?.toDate()
                  const timeLeft = biddingEndTime ? Math.max(0, biddingEndTime - new Date()) : 0
                  const minutesLeft = Math.floor(timeLeft / 60000)

                  return (
                    <div key={transport.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{transport.goodsType}</h4>
                      <p className="text-sm text-gray-600">To: {transport.destination}</p>
                      {transport.distance && (
                        <p className="text-sm text-gray-600">Distance: {transport.distance.toFixed(1)} km</p>
                      )}
                      {transport.biddingEndTime && (
                        <p className="text-sm font-medium text-orange-600">
                          Bidding ends in: {minutesLeft} minutes
                        </p>
                      )}
                      {transport.bids && transport.bids.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Current lowest bid: ৳{Math.min(...transport.bids.map(b => b.bidAmount)).toFixed(2)}
                        </p>
                      )}
                      <div className="mt-3">
                        <Input
                          type="number"
                          placeholder="Your bid amount (৳)"
                          value={biddingTransports[transport.id] || ''}
                          onChange={(e) => setBiddingTransports(prev => ({
                            ...prev,
                            [transport.id]: e.target.value
                          }))}
                          className="mb-2"
                        />
                        <Button
                          size="sm"
                          onClick={() => handlePlaceBid(transport.id, biddingTransports[transport.id])}
                          disabled={!biddingTransports[transport.id]}
                        >
                          Place Bid
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* My Transports */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">My Transports</h3>
            {myTransports.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No assigned transports</p>
            ) : (
              <div className="space-y-4">
                {myTransports.map(transport => (
                  <div key={transport.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{transport.goodsType}</h4>
                    <p className="text-sm text-gray-600">To: {transport.destination}</p>
                    <p className="text-sm">
                      Status: <span className={`font-medium ${
                        transport.status === 'delivered' ? 'text-green-600' :
                        transport.status === 'in-transit' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {transport.status}
                      </span>
                    </p>
                    {transport.finalBidAmount && (
                      <p className="text-sm text-gray-600">Earnings: ৳{transport.finalBidAmount.toFixed(2)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

