import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc,
  onSnapshot,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { calculateFreshPrice, formatPrice } from '../utils/priceFreshness'
import { addToCart, addToWishlist } from '../services/cartService'
import { getFarmerRatings } from '../services/ratingService'
import Button from '../components/Button'
import Input from '../components/Input'
import Navbar from '../components/Navbar'

function AddToCartButton({ productId, product }) {
  const { user } = useAuth()
  const [adding, setAdding] = useState(false)

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please sign in to add to cart')
      return
    }
    setAdding(true)
    try {
      await addToCart({
        userId: user.uid,
        productId,
        productName: product.name,
        quantity: 1
      })
      alert('Added to cart!')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleAddToCart} disabled={adding} className="px-3">
      {adding ? '...' : '🛒'}
    </Button>
  )
}

function AddToWishlistButton({ productId, product }) {
  const { user } = useAuth()
  const [adding, setAdding] = useState(false)

  const handleAddToWishlist = async () => {
    if (!user) {
      alert('Please sign in to add to wishlist')
      return
    }
    setAdding(true)
    try {
      await addToWishlist({
        userId: user.uid,
        productId,
        productName: product.name
      })
      alert('Added to wishlist!')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleAddToWishlist} disabled={adding} className="px-3">
      {adding ? '...' : '❤️'}
    </Button>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, userData } = useAuth()
  const [product, setProduct] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderData, setOrderData] = useState({
    quantity: '',
    coldStorage: false,
    subscriptionPlan: ''
  })
  const [farmerRatings, setFarmerRatings] = useState(null)

  useEffect(() => {
    if (!id) return

    const unsub = onSnapshot(doc(db, 'products', id), snapshot => {
      if (snapshot.exists()) setProduct({ id: snapshot.id, ...snapshot.data() })
      else setProduct(null)
    })

    return unsub
  }, [id])

  useEffect(() => {
    if (!id) return

    const q = query(
      collection(db, 'messages'),
      where('productId', '==', id),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, snapshot => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return unsub
  }, [id])

  const loadFarmerRatings = useCallback(async () => {
    if (!product?.farmerId) return
    try {
      const ratings = await getFarmerRatings(product.farmerId)
      setFarmerRatings(ratings)
    } catch (err) {
      console.error('Error loading ratings:', err)
    }
  }, [product?.farmerId])

  useEffect(() => {
    loadFarmerRatings()
  }, [loadFarmerRatings])

  const priceInfo = useMemo(() => {
    if (!product) return null
    return calculateFreshPrice(product.marketPrice, product.listedAt)
  }, [product?.marketPrice, product?.listedAt])

  const sendMessage = async () => {
    if (!user) {
      alert('Please sign in to send messages')
      return
    }
    if (!newMessage.trim()) return
    try {
      await addDoc(collection(db, 'messages'), {
        productId: id,
        fromUserId: user.uid,
        fromUserName: userData?.name || user.email,
        fromUserRole: userData?.role,
        message: newMessage.trim(),
        createdAt: Timestamp.now()
      })
      setNewMessage('')
    } catch (err) {
      alert('Error sending message: ' + err.message)
    }
  }

  const handleBuyNow = async () => {
    if (!user) {
      alert('Please sign in to place orders')
      return
    }
    
    const quantity = parseFloat(orderData.quantity)
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity')
      return
    }
    
    // Inventory validation
    const availableQty = product.availableQuantity !== undefined ? product.availableQuantity : product.quantity
    if (quantity > availableQty) {
      alert(`Only ${availableQty} ${product.unit} available. You requested ${quantity} ${product.unit}.`)
      return
    }
    
    if (availableQty <= 0) {
      alert('This product is out of stock')
      return
    }

    try {
      // Add item to cart with the specified quantity
      await addToCart({
        userId: user.uid,
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        // Store additional order data in cart for checkout
        coldStorage: orderData.coldStorage || false,
        subscriptionPlan: orderData.subscriptionPlan || null
      })

      // Close modal and redirect to checkout
      setShowOrderModal(false)
      setOrderData({ quantity: '', coldStorage: false, subscriptionPlan: '' })
      navigate('/checkout')
    } catch (err) {
      alert('Error adding to cart: ' + err.message)
    }
  }

  if (!product || !priceInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" onClick={() => navigate('/marketplace')} className="mb-6">
          ← Back to Marketplace
        </Button>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* AI Analysis Display */}
          {product.aiAnalysis && product.aiAnalysis.success && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              product.aiAnalysis.is_recommended 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  🤖 AI Quality Analysis
                  {product.aiAnalysis.is_recommended && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">Verified</span>
                  )}
                </h3>
                <div className={`px-4 py-2 rounded-full ${
                  product.aiAnalysis.rating >= 8 ? 'bg-green-100 text-green-600' :
                  product.aiAnalysis.rating >= 6 ? 'bg-yellow-100 text-yellow-600' :
                  product.aiAnalysis.rating >= 4 ? 'bg-orange-100 text-orange-600' :
                  'bg-red-100 text-red-600'
                } font-bold text-xl`}>
                  {product.aiAnalysis.rating}/10
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Condition: </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    product.aiAnalysis.condition === 'fresh' ? 'bg-green-100 text-green-800' :
                    product.aiAnalysis.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                    product.aiAnalysis.condition === 'average' ? 'bg-yellow-100 text-yellow-800' :
                    product.aiAnalysis.condition === 'poor' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.aiAnalysis.condition?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                {product.aiAnalysis.defects && product.aiAnalysis.defects.length > 0 && (
                  <div>
                    <span className="font-medium">Defects: </span>
                    <span className="text-red-600">{product.aiAnalysis.defects.join(', ')}</span>
                  </div>
                )}
              </div>
              {product.aiAnalysis.recommendation && (
                <p className="mt-2 text-sm text-gray-700">{product.aiAnalysis.recommendation}</p>
              )}
            </div>
          )}

          {product.cropImages?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Crop Quality Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.cropImages.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`Crop quality ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-75"
                    onClick={() => window.open(imgUrl, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-600">By: {product.farmerName}</p>
              {priceInfo.isFresh ? (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm mt-2">
                  Fresh - Listed Today
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm mt-2">
                  {priceInfo.discount.toFixed(0)}% Discount - {priceInfo.daysOld} day(s) old
                </span>
              )}
            </div>
            <div className="text-right">
              {priceInfo.isFresh ? (
                <p className="text-3xl font-bold text-green-600">
                  {formatPrice(priceInfo.price)}/{product.unit}
                </p>
              ) : (
                <div>
                  <p className="text-lg text-gray-400 line-through">
                    {formatPrice(product.marketPrice)}
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatPrice(priceInfo.price)}/{product.unit}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Available Quantity</p>
              <p className={`text-lg font-semibold ${(product.availableQuantity !== undefined ? product.availableQuantity : product.quantity) <= 0 ? 'text-red-600' : ''}`}>
                {product.availableQuantity !== undefined ? product.availableQuantity : product.quantity} {product.unit}
                {(product.availableQuantity !== undefined ? product.availableQuantity : product.quantity) <= 0 && (
                  <span className="ml-2 text-sm text-red-600">(Out of Stock)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Listed Date</p>
              <p className="text-lg font-semibold">
                {new Date(product.listedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {userData?.role === 'buyer' && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowOrderModal(true)} 
                className="flex-1"
                disabled={(product.availableQuantity !== undefined ? product.availableQuantity : product.quantity) <= 0}
              >
                {(product.availableQuantity !== undefined ? product.availableQuantity : product.quantity) <= 0 ? 'Out of Stock' : 'Buy Now'}
              </Button>
              <AddToCartButton productId={product.id} product={product} />
              <AddToWishlistButton productId={product.id} product={product} />
            </div>
          )}
        </div>

        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Buy Now - Add to Checkout</h2>
              <p className="text-sm text-gray-600 mb-4">
                Select quantity and options, then proceed to checkout to complete your purchase.
              </p>

              <Input
                label={`Quantity (${product.unit})`}
                type="number"
                min="1"
                max={product.availableQuantity !== undefined ? product.availableQuantity : product.quantity}
                value={orderData.quantity}
                onChange={e => {
                  const value = parseFloat(e.target.value)
                  const maxQty = product.availableQuantity !== undefined ? product.availableQuantity : product.quantity
                  if (value > maxQty) {
                    alert(`Maximum available quantity is ${maxQty} ${product.unit}`)
                    setOrderData({ ...orderData, quantity: maxQty.toString() })
                  } else {
                    setOrderData({ ...orderData, quantity: e.target.value })
                  }
                }}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {product.availableQuantity !== undefined ? product.availableQuantity : product.quantity} {product.unit}
              </p>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={orderData.coldStorage}
                    onChange={e =>
                      setOrderData({ ...orderData, coldStorage: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span>Book Cold Storage</span>
                </label>
              </div>

              {orderData.coldStorage && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={orderData.subscriptionPlan}
                    onChange={e =>
                      setOrderData({ ...orderData, subscriptionPlan: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select plan</option>
                    <option value="basic">Basic - ৳500/month</option>
                    <option value="pro">Pro - ৳1500/month</option>
                  </select>
                </div>
              )}

              {orderData.quantity && (
                <div className="mb-4 p-3 bg-gray-100 rounded">
                  <p className="text-sm text-gray-600">
                    Total: {formatPrice(priceInfo.price * parseFloat(orderData.quantity || 0))}
                  </p>
                  {orderData.coldStorage && orderData.subscriptionPlan && (
                    <p className="text-sm text-gray-600">
                      + Storage: ৳{orderData.subscriptionPlan === 'basic' ? '500' : '1500'}/month
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleBuyNow} className="flex-1">
                  Proceed to Checkout
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Questions & Messages</h2>

          <div className="mb-4 space-y-3 max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No messages yet</p>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.fromUserId === user?.uid ? 'bg-green-50 ml-8' : 'bg-gray-100 mr-8'
                  }`}
                >
                  <p className="text-sm font-semibold">
                    {msg.fromUserName} ({msg.fromUserRole})
                  </p>
                  <p>{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {msg.createdAt?.toDate().toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
