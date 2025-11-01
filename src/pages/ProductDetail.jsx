import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { calculateFreshPrice, formatPrice } from '../utils/priceFreshness'
import Button from '../components/Button'
import Input from '../components/Input'
import Navbar from '../components/Navbar'

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

  useEffect(() => {
    loadProduct()
    loadMessages()
  }, [id])

  const loadProduct = async () => {
    const docRef = doc(db, 'products', id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      setProduct({ id: docSnap.id, ...docSnap.data() })
    }
  }

  const loadMessages = async () => {
    const q = query(
      collection(db, 'messages'),
      where('productId', '==', id),
      orderBy('createdAt', 'asc')
    )
    const snapshot = await getDocs(q)
    setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    try {
      await addDoc(collection(db, 'messages'), {
        productId: id,
        fromUserId: user.uid,
        fromUserName: userData?.name || user.email,
        fromUserRole: userData?.role,
        message: newMessage,
        createdAt: Timestamp.now()
      })
      setNewMessage('')
      loadMessages()
    } catch (err) {
      alert('Error sending message: ' + err.message)
    }
  }

  const placeOrder = async () => {
    if (!orderData.quantity || parseFloat(orderData.quantity) <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    try {
      const priceInfo = calculateFreshPrice(product.marketPrice, product.listedAt)
      const totalPrice = priceInfo.price * parseFloat(orderData.quantity)
      
      await addDoc(collection(db, 'orders'), {
        productId: product.id,
        productName: product.name,
        farmerId: product.farmerId,
        farmerName: product.farmerName,
        buyerId: user.uid,
        buyerName: userData?.name || user.email,
        quantity: parseFloat(orderData.quantity),
        unit: product.unit,
        unitPrice: priceInfo.price,
        totalPrice,
        marketPrice: product.marketPrice,
        listedAt: product.listedAt,
        status: 'pending',
        coldStorage: orderData.coldStorage,
        subscriptionPlan: orderData.subscriptionPlan || null,
        paymentHeld: true, // Escrow flag
        createdAt: Timestamp.now()
      })

      alert('Order placed successfully! Payment held in escrow until delivery.')
      setShowOrderModal(false)
      setOrderData({ quantity: '', coldStorage: false, subscriptionPlan: '' })
      navigate('/')
    } catch (err) {
      alert('Error placing order: ' + err.message)
    }
  }

  if (!product) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  }

  const priceInfo = calculateFreshPrice(product.marketPrice, product.listedAt)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" onClick={() => navigate('/marketplace')} className="mb-6">
          ← Back to Marketplace
        </Button>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
              <p className="text-lg font-semibold">{product.quantity} {product.unit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Listed Date</p>
              <p className="text-lg font-semibold">{new Date(product.listedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {userData?.role === 'buyer' && (
            <Button onClick={() => setShowOrderModal(true)} className="w-full">
              Place Order
            </Button>
          )}
        </div>

        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Place Order</h2>
              
              <Input
                label={`Quantity (${product.unit})`}
                type="number"
                value={orderData.quantity}
                onChange={(e) => setOrderData({ ...orderData, quantity: e.target.value })}
                required
              />

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={orderData.coldStorage}
                    onChange={(e) => setOrderData({ ...orderData, coldStorage: e.target.checked })}
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
                    onChange={(e) => setOrderData({ ...orderData, subscriptionPlan: e.target.value })}
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
                  <p className="text-sm text-gray-600">Total: {formatPrice(priceInfo.price * parseFloat(orderData.quantity || 0))}</p>
                  {orderData.coldStorage && orderData.subscriptionPlan && (
                    <p className="text-sm text-gray-600">
                      + Storage: ৳{orderData.subscriptionPlan === 'basic' ? '500' : '1500'}/month
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={placeOrder} className="flex-1">Confirm Order</Button>
                <Button variant="secondary" onClick={() => setShowOrderModal(false)} className="flex-1">
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
                <div key={msg.id} className={`p-3 rounded-lg ${
                  msg.fromUserId === user?.uid ? 'bg-green-50 ml-8' : 'bg-gray-100 mr-8'
                }`}>
                  <p className="text-sm font-semibold">{msg.fromUserName} ({msg.fromUserRole})</p>
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
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

