import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { getCartItems, clearCart } from '../services/cartService'
import { calculateFreshPrice, formatPrice } from '../utils/priceFreshness'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'

export default function Checkout() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState({
    method: 'bkash',
    phone: '',
    transactionId: ''
  })

  useEffect(() => {
    if (!user || !userData) return
    if (!userData.verified) {
      alert('Please verify your account before making purchases')
      navigate('/buyer-verification')
      return
    }
    const loadCart = async () => {
      setLoading(true)
      try {
        const items = await getCartItems(user.uid)
        setCartItems(items)

        const uniqueProductIds = [...new Set(items.map(({ productId }) => productId))]
        const productEntries = await Promise.all(
          uniqueProductIds.map(async (productId) => {
            try {
              const snapshot = await getDoc(doc(db, 'products', productId))
              return snapshot.exists() ? [productId, { id: snapshot.id, ...snapshot.data() }] : null
            } catch (err) {
              console.log(`Error loading product ${productId}:`, err.message)
              return null
            }
          })
        )
        setProducts(Object.fromEntries(productEntries.filter(Boolean)))
      } catch (error) {
        console.error('Error loading cart:', error)
        // Set empty state on error
        setCartItems([])
        setProducts({})
        if (error.code === 'permission-denied') {
          alert('Permission error: Please check Firebase rules for cart collection')
        }
      } finally {
        setLoading(false)
      }
    }
    loadCart()
  }, [user, userData, navigate])

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const product = products[item.productId]
      if (!product) return sum
      const { price } = calculateFreshPrice(product.marketPrice, product.listedAt)
      return sum + price * (item.quantity || 1)
    }, 0)
  }, [cartItems, products])

  const handlePayment = useCallback(async () => {
    if (!paymentData.phone) {
      alert('Please enter your payment number')
      return
    }

    setProcessing(true)
    try {
      await Promise.all(
        cartItems.map(async (item) => {
          const product = products[item.productId]
          if (!product) return
          const { price } = calculateFreshPrice(product.marketPrice, product.listedAt)
          const quantity = item.quantity || 1

          await addDoc(collection(db, 'orders'), {
            productId: product.id,
            productName: product.name,
            farmerId: product.farmerId,
            farmerName: product.farmerName,
            buyerId: user.uid,
            buyerName: userData?.name || user.email,
            quantity,
            unit: product.unit,
            unitPrice: price,
            totalPrice: price * quantity,
            marketPrice: product.marketPrice,
            listedAt: product.listedAt,
            status: 'pending',
            paymentMethod: paymentData.method,
            paymentPhone: paymentData.phone,
            paymentTransactionId: paymentData.transactionId || `TXN${Date.now()}`,
            paymentHeld: true,
            createdAt: Timestamp.now()
          })
        })
      )

      await clearCart(user.uid)
      alert('Payment successful! Order placed.')
      navigate('/orders')
    } catch (error) {
      alert(`Payment error: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }, [cartItems, navigate, paymentData, products, user, userData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-deshbazar-primary mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Payment Method
                </label>
                <select
                  value={paymentData.method}
                  onChange={(e) =>
                    setPaymentData((prev) => ({ ...prev, method: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deshbazar-primary"
                >
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                </select>
              </div>

              <Input
                label={
                  paymentData.method === 'bkash'
                    ? 'bKash Number'
                    : paymentData.method === 'nagad'
                    ? 'Nagad Number'
                    : 'Rocket Number'
                }
                type="tel"
                value={paymentData.phone}
                onChange={(e) =>
                  setPaymentData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="01XXXXXXXXX"
                required
              />

              <Input
                label="Transaction ID (Optional)"
                value={paymentData.transactionId}
                onChange={(e) =>
                  setPaymentData((prev) => ({ ...prev, transactionId: e.target.value }))
                }
                placeholder="Enter transaction ID"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Demo Payment:</strong> This is a hackathon demo. No real payment will be
                  processed.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const product = products[item.productId]
                  if (!product) return null
                  const { price } = calculateFreshPrice(product.marketPrice, product.listedAt)
                  const quantity = item.quantity || 1
                  const itemTotal = price * quantity

                  return (
                    <div key={item.id} className="flex justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {quantity} {product.unit} × {formatPrice(price)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatPrice(itemTotal)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-deshbazar-primary">{formatPrice(total)}</span>
                </div>
              </div>
              <Button onClick={handlePayment} disabled={processing || cartItems.length === 0} className="w-full mb-2">
                {processing ? 'Processing Payment...' : `Pay ৳${total.toFixed(2)}`}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/cart')} className="w-full">
                Back to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
