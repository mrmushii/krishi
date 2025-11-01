import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { submitRating, hasRatedOrder } from '../services/ratingService'
import Button from '../components/Button'
import Navbar from '../components/Navbar'

export default function RateFarmer() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { user, userData } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyRated, setAlreadyRated] = useState(false)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  useEffect(() => {
    if (!orderId || !user?.uid) return
    let active = true

    ;(async () => {
      setLoading(true)
      try {
        const [orderSnap, rated] = await Promise.all([
          getDoc(doc(db, 'orders', orderId)),
          hasRatedOrder(user.uid, orderId)
        ])

        if (!active) return
        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() })
        } else {
          setOrder(null)
        }
        setAlreadyRated(rated)
      } catch (err) {
        console.error('Error loading rating data:', err)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [orderId, user?.uid])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!order || !user?.uid) return

    setSubmitting(true)
    try {
      await submitRating({
        farmerId: order.farmerId,
        farmerName: order.farmerName,
        buyerId: user.uid,
        buyerName: userData?.name || user.email,
        orderId,
        rating,
        review,
        productName: order.productName
      })

      alert('Thank you for your rating!')
      navigate('/orders')
    } catch (err) {
      alert('Error submitting rating: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-deshbazar-primary mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order || alreadyRated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {alreadyRated ? 'You have already rated this order.' : 'Order not found.'}
            </p>
            <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-2">Rate Farmer</h1>
          <p className="text-gray-600 mb-6">
            Rate your experience with <strong>{order.farmerName}</strong> for your purchase of <strong>{order.productName}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-4xl focus:outline-none ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">Selected: {rating} out of 5</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (Optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience..."
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deshbazar-primary"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/orders')} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
