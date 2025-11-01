import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { getCartItems, removeFromCart, updateCartQuantity, clearCart } from '../services/cartService'
import { calculateFreshPrice, formatPrice } from '../utils/priceFreshness'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

export default function Cart() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadCart()
    }
  }, [user])

  const loadCart = async () => {
    setLoading(true)
    try {
      const items = await getCartItems(user.uid)
      setCartItems(items)
      
      // Load product details
      const productMap = {}
      for (const item of items) {
        const productDoc = await getDoc(doc(db, 'products', item.productId))
        if (productDoc.exists()) {
          productMap[item.productId] = { id: productDoc.id, ...productDoc.data() }
        }
      }
      setProducts(productMap)
    } catch (err) {
      console.error('Error loading cart:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (cartId) => {
    try {
      await removeFromCart(cartId)
      loadCart()
    } catch (err) {
      alert('Error removing item: ' + err.message)
    }
  }

  const handleQuantityChange = async (cartId, newQuantity) => {
    try {
      await updateCartQuantity(cartId, parseInt(newQuantity))
      loadCart()
    } catch (err) {
      alert('Error updating quantity: ' + err.message)
    }
  }

  const calculateTotal = () => {
    let total = 0
    cartItems.forEach(item => {
      const product = products[item.productId]
      if (product) {
        const priceInfo = calculateFreshPrice(product.marketPrice, product.listedAt)
        total += priceInfo.price * (item.quantity || 1)
      }
    })
    return total
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-farmlink-orange mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/marketplace')}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(item => {
                const product = products[item.productId]
                if (!product) return null
                const priceInfo = calculateFreshPrice(product.marketPrice, product.listedAt)
                const itemTotal = priceInfo.price * (item.quantity || 1)
                
                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex gap-4">
                      {product.cropImages && product.cropImages.length > 0 && (
                        <img 
                          src={product.cropImages[0]} 
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">By: {product.farmerName}</p>
                        <div className="flex items-center gap-4">
                          <div>
                            <label className="text-sm text-gray-500">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              max={product.quantity}
                              value={item.quantity || 1}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded ml-2"
                            />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-farmlink-orange">
                              {formatPrice(itemTotal)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatPrice(priceInfo.price)} per {product.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Items</span>
                    <span>{cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}</span>
                  </div>
                </div>
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-farmlink-orange">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/checkout')}
                  className="w-full mb-2"
                >
                  Proceed to Checkout
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/marketplace')}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

