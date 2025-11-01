import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { getCartItems, removeFromCart, updateCartQuantity } from '../services/cartService'
import { calculateFreshPrice, formatPrice } from '../utils/priceFreshness'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

export default function Cart() {
  const { user } = useAuth()
  const userId = user?.uid
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(true)

  const loadCart = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const items = await getCartItems(userId)
      setCartItems(items)

      const productIds = [...new Set(items.map(item => item.productId))]
      const productSnaps = await Promise.all(
        productIds.map(id => getDoc(doc(db, 'products', id)))
      )

      const productMap = {}
      productSnaps.forEach(snap => {
        if (snap.exists()) {
          productMap[snap.id] = { id: snap.id, ...snap.data() }
        }
      })
      setProducts(productMap)
    } catch (err) {
      console.error('Error loading cart:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setCartItems([])
      setProducts({})
      setLoading(false)
      return
    }
    loadCart()
  }, [userId, loadCart])

  const handleRemove = useCallback(
    async (cartId) => {
      try {
        await removeFromCart(cartId)
        loadCart()
      } catch (err) {
        alert('Error removing item: ' + err.message)
      }
    },
    [loadCart]
  )

  const handleQuantityChange = useCallback(
    async (cartId, rawQuantity) => {
      const nextQuantity = Math.max(1, Number(rawQuantity) || 1)
      try {
        await updateCartQuantity(cartId, nextQuantity)
        loadCart()
      } catch (err) {
        alert('Error updating quantity: ' + err.message)
      }
    },
    [loadCart]
  )

  const enrichedItems = useMemo(
    () =>
      cartItems
        .map(item => {
          const product = products[item.productId]
          if (!product) return null
          const priceInfo = calculateFreshPrice(product.marketPrice, product.listedAt)
          const quantity = item.quantity || 1
          return {
            ...item,
            product,
            priceInfo,
            quantity,
            itemTotal: priceInfo.price * quantity,
          }
        })
        .filter(Boolean),
    [cartItems, products]
  )

  const { subtotal, totalItems } = useMemo(() => {
    return enrichedItems.reduce(
      (acc, item) => {
        acc.subtotal += item.itemTotal
        acc.totalItems += item.quantity
        return acc
      },
      { subtotal: 0, totalItems: 0 }
    )
  }, [enrichedItems])

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

        {enrichedItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/marketplace')}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {enrichedItems.map(({ id, product, priceInfo, itemTotal, quantity }) => (
                <div key={id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex gap-4">
                    {product.cropImages?.length > 0 && (
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
                            value={quantity}
                            onChange={(e) => handleQuantityChange(id, e.target.value)}
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
                      onClick={() => handleRemove(id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Items</span>
                    <span>{totalItems}</span>
                  </div>
                </div>
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-farmlink-orange">{formatPrice(subtotal)}</span>
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
