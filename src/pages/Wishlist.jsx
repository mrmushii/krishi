import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { getWishlistItems, removeFromWishlist, addToCart } from '../services/cartService'
import { calculateFreshPrice, formatPrice } from '../utils/priceFreshness'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

export default function Wishlist() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setEntries([])
      setLoading(false)
      return
    }

    let isMounted = true
    const loadWishlist = async () => {
      setLoading(true)
      try {
        const wishlist = await getWishlistItems(user.uid)
        if (!wishlist.length) {
          if (isMounted) setEntries([])
          return
        }

        const productDocs = await Promise.all(
          wishlist.map(({ productId }) => getDoc(doc(db, 'products', productId)))
        )

        const combined = wishlist.reduce((acc, item, index) => {
          const snapshot = productDocs[index]
          if (!snapshot.exists()) return acc
          acc.push({
            wishlist: item,
            product: { id: snapshot.id, ...snapshot.data() }
          })
          return acc
        }, [])

        if (isMounted) setEntries(combined)
      } catch (err) {
        console.error('Error loading wishlist:', err)
        if (isMounted) setEntries([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadWishlist()
    return () => {
      isMounted = false
    }
  }, [user])

  const handleRemove = async (wishlistId) => {
    try {
      await removeFromWishlist(wishlistId)
      setEntries(prev => prev.filter(({ wishlist }) => wishlist.id !== wishlistId))
    } catch (err) {
      alert('Error removing item: ' + err.message)
    }
  }

  const handleAddToCart = async (productId) => {
    try {
      if (!user) return navigate('/signin')
      await addToCart({ userId: user.uid, productId, quantity: 1 })
      alert('Added to cart!')
    } catch (err) {
      alert('Error: ' + err.message)
    }
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
        <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>

        {entries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Your wishlist is empty</p>
            <Button onClick={() => navigate('/marketplace')}>Browse Products</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map(({ wishlist, product }) => {
              const priceInfo = calculateFreshPrice(product.marketPrice, product.listedAt)

              return (
                <div key={wishlist.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {product.cropImages?.[0] && (
                    <img
                      src={product.cropImages[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                    />
                  )}
                  <div className="p-4">
                    <h3
                      className="text-xl font-semibold mb-2 cursor-pointer hover:text-farmlink-orange"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">By: {product.farmerName}</p>
                    <p className="text-2xl font-bold text-farmlink-orange mb-4">
                      {formatPrice(priceInfo.price)}/{product.unit}
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={() => handleAddToCart(product.id)} className="flex-1">
                        Add to Cart
                      </Button>
                      <Button variant="danger" onClick={() => handleRemove(wishlist.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
