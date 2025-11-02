import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { db } from '../config/firebase'
import { uploadToCloudinary } from '../services/storageService'
import { 
  createTransportRequest, 
  getUserTransports, 
  subscribeToActiveTransports,
  autoAssignTransport
} from '../services/transportService'
import {
  createColdStorageRental,
  getFarmerColdStorageRentals,
  addGoodsToStorage
} from '../services/coldStorageService'
import Button from '../components/Button'
import Input from '../components/Input'
import Navbar from '../components/Navbar'
import TransportMap from '../components/TransportMap'
import CropAnalyzer from '../components/CropAnalyzer'

const INITIAL_PRODUCT = {
  name: '',
  quantity: '',
  marketPrice: '',
  unit: 'kg',
  cropImages: []
}

export default function FarmerDashboard() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState(INITIAL_PRODUCT)
  const [cropPreviews, setCropPreviews] = useState([])
  const [transports, setTransports] = useState([])
  const [showTransportForm, setShowTransportForm] = useState(false)
  const [transportForm, setTransportForm] = useState({
    goodsType: '',
    quantity: '',
    pickupLocation: { lat: '', lng: '' },
    destination: '',
    biddingDuration: 5 // minutes
  })
  const [coldStorageRentals, setColdStorageRentals] = useState([])
  const [showColdStorageForm, setShowColdStorageForm] = useState(false)
  const [coldStorageForm, setColdStorageForm] = useState({
    storageName: '',
    capacity: '',
    duration: '',
    startDate: ''
  })
  const [showTrackMap, setShowTrackMap] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)

  const loadProducts = useCallback(async () => {
    if (!user) return
    const q = query(collection(db, 'products'), where('farmerId', '==', user.uid))
    const snapshot = await getDocs(q)
    setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }, [user])

  const loadTransports = useCallback(async () => {
    if (!user) return
    const transports = await getUserTransports(user.uid, 'farmer')
    setTransports(transports)

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
  }, [user])

  const loadColdStorage = useCallback(async () => {
    if (!user) return
    const rentals = await getFarmerColdStorageRentals(user.uid)
    setColdStorageRentals(rentals)
  }, [user])

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    if (userData?.role === 'farmer') {
      if (!userData?.registrationPaid) {
        navigate('/farmer-payment')
        return
      }
      if (!userData?.verified && !userData?.onboardingComplete) {
        navigate('/onboarding')
        return
      }
    }
    loadProducts()
    loadTransports()
    loadColdStorage()

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadProducts()
      loadTransports()
      loadColdStorage()
    }, 10000)

    return () => clearInterval(interval)
  }, [userData, navigate, loadProducts, loadTransports, loadColdStorage])

  useEffect(() => {
    const urls = newProduct.cropImages.map(file => URL.createObjectURL(file))
    setCropPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [newProduct.cropImages])

  const handleCropImageUpload = (e) => {
    const files = e?.target?.files ? Array.from(e.target.files) : []
    setNewProduct(prev => ({ ...prev, cropImages: files }))
  }

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target
    setNewProduct(prev => ({ ...prev, [field]: value }))
  }

  const handleRemoveImage = (idx) => {
    setNewProduct(prev => ({
      ...prev,
      cropImages: prev.cropImages.filter((_, i) => i !== idx)
    }))
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      const cropImageUrls = await Promise.all(
        newProduct.cropImages.map(image => uploadToCloudinary(image, `products/${user.uid}`))
      )

      await addDoc(collection(db, 'products'), {
        name: newProduct.name.trim(),
        quantity: parseFloat(newProduct.quantity) || 0,
        availableQuantity: parseFloat(newProduct.quantity) || 0, // Track available inventory
        marketPrice: parseFloat(newProduct.marketPrice) || 0,
        unit: newProduct.unit,
        cropImages: cropImageUrls,
        farmerId: user.uid,
        farmerName: userData?.name || user.email,
        listedAt: new Date().toISOString(),
        status: 'available',
        aiAnalysis: newProduct.aiAnalysis || null, // Store AI analysis results
        createdAt: Timestamp.now()
      })

      setNewProduct(INITIAL_PRODUCT)
      setShowAddProduct(false)
      loadProducts()
    } catch (err) {
      alert('Error adding product: ' + err.message)
    }
  }

  const handleCreateTransport = async (e) => {
    e.preventDefault()
    try {
      const biddingEndTime = new Date()
      biddingEndTime.setMinutes(biddingEndTime.getMinutes() + parseInt(transportForm.biddingDuration))

      await createTransportRequest({
        farmerId: user.uid,
        farmerName: userData?.name || user.email,
        goodsType: transportForm.goodsType,
        quantity: transportForm.quantity,
        pickupLocation: {
          lat: parseFloat(transportForm.pickupLocation.lat),
          lng: parseFloat(transportForm.pickupLocation.lng)
        },
        destination: transportForm.destination,
        biddingEndTime: Timestamp.fromDate(biddingEndTime),
        biddingDuration: parseInt(transportForm.biddingDuration)
      })

      alert('Transport request created! Drivers can now bid on it.')
      setTransportForm({
        goodsType: '',
        quantity: '',
        pickupLocation: { lat: '', lng: '' },
        destination: '',
        biddingDuration: 5
      })
      setShowTransportForm(false)
      loadTransports()

      // Auto-assign after bidding duration
      setTimeout(async () => {
        const updatedTransports = await getUserTransports(user.uid, 'farmer')
        const transport = updatedTransports.find(t => t.status === 'pending')
        if (transport) {
          await autoAssignTransport(transport.id)
          loadTransports()
        }
      }, parseInt(transportForm.biddingDuration) * 60 * 1000)
    } catch (err) {
      alert('Error creating transport request: ' + err.message)
    }
  }

  const handleCreateColdStorage = async (e) => {
    e.preventDefault()
    try {
      await createColdStorageRental({
        farmerId: user.uid,
        farmerName: userData?.name || user.email,
        storageName: coldStorageForm.storageName,
        capacity: parseFloat(coldStorageForm.capacity),
        duration: parseInt(coldStorageForm.duration),
        startDate: Timestamp.fromDate(new Date(coldStorageForm.startDate)),
        storedGoods: []
      })

      alert('Cold storage rental created!')
      setColdStorageForm({
        storageName: '',
        capacity: '',
        duration: '',
        startDate: ''
      })
      setShowColdStorageForm(false)
      loadColdStorage()
    } catch (err) {
      alert('Error creating cold storage rental: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {userData?.name || user?.email}</h2>
          {userData?.verified && (
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              ✓ Verified Farmer
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'products'
                  ? 'border-b-2 border-deshbazar-primary text-deshbazar-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('transport')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'transport'
                  ? 'border-b-2 border-deshbazar-primary text-deshbazar-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Transport
            </button>
            <button
              onClick={() => setActiveTab('coldStorage')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'coldStorage'
                  ? 'border-b-2 border-deshbazar-primary text-deshbazar-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cold Storage
            </button>
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Products</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/orders')}>
                  My Orders
                </Button>
                <Button onClick={() => setShowAddProduct(prev => !prev)}>
                  {showAddProduct ? 'Cancel' : '+ Add Product'}
                </Button>
              </div>
            </div>

        {showAddProduct && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
            
            {/* Crop Quality Analyzer */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-900">🤖 AI Crop Quality Analyzer</h4>
              <p className="text-sm text-blue-700 mb-3">
                Upload crop images to get AI-powered quality analysis with ratings and recommendations
              </p>
              <CropAnalyzer
                cropType={newProduct.name || 'general'}
                onAnalysisComplete={(result) => {
                  if (result.success) {
                    // Store analysis result with product
                    setNewProduct(prev => ({
                      ...prev,
                      aiAnalysis: result
                    }))
                  }
                }}
              />
            </div>

            <form onSubmit={handleAddProduct}>
              <Input
                label="Product Name"
                value={newProduct.name}
                onChange={handleFieldChange('name')}
                required
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={newProduct.quantity}
                  onChange={handleFieldChange('quantity')}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={newProduct.unit}
                    onChange={handleFieldChange('unit')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">Quintal</option>
                    <option value="ton">Ton</option>
                  </select>
                </div>
              </div>

              <Input
                label="Market Price (৳ per unit)"
                type="number"
                value={newProduct.marketPrice}
                onChange={handleFieldChange('marketPrice')}
                required
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Quality Images (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCropImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {cropPreviews.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Selected {cropPreviews.length} image(s):</p>
                    <div className="grid grid-cols-3 gap-2">
                      {cropPreviews.map((src, idx) => (
                        <div key={src} className="relative">
                          <img
                            src={src}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">Add Product</Button>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No products listed yet. Add your first product!
            </div>
          ) : (
            products.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <p className="text-gray-600">Quantity: {product.quantity} {product.unit}</p>
                    <p className="text-gray-600">Market Price: ৳{product.marketPrice} per {product.unit}</p>
                    <p className="text-sm text-gray-500">
                      Listed: {new Date(product.listedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      product.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        </>
        )}

        {/* Transport Tab */}
        {activeTab === 'transport' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Transport Management</h2>
              <div className="flex gap-2">
                <Button onClick={() => setShowTrackMap(!showTrackMap)}>
                  {showTrackMap ? 'Hide' : 'Track'} Transport Map
                </Button>
                <Button onClick={() => setShowTransportForm(prev => !prev)}>
                  {showTransportForm ? 'Cancel' : '+ Request Transport'}
                </Button>
              </div>
            </div>

            {showTrackMap && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Live Transport Tracking</h3>
                <TransportMap
                  transports={transports.filter(t => t.status === 'in-transit' || t.status === 'assigned')}
                  center={currentLocation || { lat: 23.8103, lng: 90.4125 }}
                  height="500px"
                />
              </div>
            )}

            {showTransportForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Request Transport</h3>
                <form onSubmit={handleCreateTransport}>
                  <Input
                    label="Goods Type"
                    value={transportForm.goodsType}
                    onChange={(e) => setTransportForm(prev => ({ ...prev, goodsType: e.target.value }))}
                    required
                  />
                  <Input
                    label="Quantity"
                    value={transportForm.quantity}
                    onChange={(e) => setTransportForm(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Input
                      label="Pickup Latitude"
                      type="number"
                      step="any"
                      value={transportForm.pickupLocation.lat}
                      onChange={(e) => setTransportForm(prev => ({
                        ...prev,
                        pickupLocation: { ...prev.pickupLocation, lat: e.target.value }
                      }))}
                      required
                    />
                    <Input
                      label="Pickup Longitude"
                      type="number"
                      step="any"
                      value={transportForm.pickupLocation.lng}
                      onChange={(e) => setTransportForm(prev => ({
                        ...prev,
                        pickupLocation: { ...prev.pickupLocation, lng: e.target.value }
                      }))}
                      required
                    />
                  </div>
                  <Input
                    label="Destination"
                    value={transportForm.destination}
                    onChange={(e) => setTransportForm(prev => ({ ...prev, destination: e.target.value }))}
                    required
                  />
                  <Input
                    label="Bidding Duration (minutes)"
                    type="number"
                    value={transportForm.biddingDuration}
                    onChange={(e) => setTransportForm(prev => ({ ...prev, biddingDuration: e.target.value }))}
                    required
                    min="2"
                    max="10"
                  />
                  <Button type="submit" className="w-full mt-4">Create Transport Request</Button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">My Transport Requests</h3>
              {transports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transport requests yet</p>
              ) : (
                <div className="space-y-4">
                  {transports.map(transport => (
                    <div key={transport.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{transport.goodsType}</h4>
                          <p className="text-sm text-gray-600">To: {transport.destination}</p>
                          <p className="text-sm text-gray-600">
                            Status: <span className="font-medium">{transport.status}</span>
                          </p>
                          {transport.assignedDriverName && (
                            <p className="text-sm text-gray-600">Driver: {transport.assignedDriverName}</p>
                          )}
                          {transport.bids && transport.bids.length > 0 && (
                            <p className="text-sm text-gray-600">
                              Bids received: {transport.bids.length}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cold Storage Tab */}
        {activeTab === 'coldStorage' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Cold Storage</h2>
              <Button onClick={() => setShowColdStorageForm(prev => !prev)}>
                {showColdStorageForm ? 'Cancel' : '+ Rent Cold Storage'}
              </Button>
            </div>

            {showColdStorageForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Rent Cold Storage</h3>
                <form onSubmit={handleCreateColdStorage}>
                  <Input
                    label="Storage Name"
                    value={coldStorageForm.storageName}
                    onChange={(e) => setColdStorageForm(prev => ({ ...prev, storageName: e.target.value }))}
                    required
                  />
                  <Input
                    label="Capacity (kg)"
                    type="number"
                    value={coldStorageForm.capacity}
                    onChange={(e) => setColdStorageForm(prev => ({ ...prev, capacity: e.target.value }))}
                    required
                  />
                  <Input
                    label="Duration (days)"
                    type="number"
                    value={coldStorageForm.duration}
                    onChange={(e) => setColdStorageForm(prev => ({ ...prev, duration: e.target.value }))}
                    required
                  />
                  <Input
                    label="Start Date"
                    type="date"
                    value={coldStorageForm.startDate}
                    onChange={(e) => setColdStorageForm(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                  <Button type="submit" className="w-full mt-4">Rent Storage</Button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">My Cold Storage Rentals</h3>
              {coldStorageRentals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No cold storage rentals yet</p>
              ) : (
                <div className="space-y-4">
                  {coldStorageRentals.map(rental => (
                    <div key={rental.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{rental.storageName}</h4>
                      <p className="text-sm text-gray-600">Capacity: {rental.capacity} kg</p>
                      <p className="text-sm text-gray-600">Status: {rental.status}</p>
                      {rental.storedGoods && rental.storedGoods.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Stored Goods:</p>
                          {rental.storedGoods.map((good, idx) => (
                            <p key={idx} className="text-sm text-gray-600">
                              - {good.name}: {good.quantity} {good.unit}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
