import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Submit a rating and review for a farmer
 */
export const submitRating = async (ratingData) => {
  const docRef = await addDoc(collection(db, 'ratings'), {
    ...ratingData,
    createdAt: Timestamp.now()
  })
  return docRef.id
}

/**
 * Get ratings for a farmer
 */
export const getFarmerRatings = async (farmerId) => {
  const q = query(
    collection(db, 'ratings'),
    where('farmerId', '==', farmerId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  const ratings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  
  // Calculate average rating
  if (ratings.length === 0) {
    return { ratings: [], averageRating: 0, totalRatings: 0 }
  }
  
  const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0)
  const averageRating = (sum / ratings.length).toFixed(1)
  
  return {
    ratings,
    averageRating: parseFloat(averageRating),
    totalRatings: ratings.length
  }
}

/**
 * Check if buyer has already rated this farmer for a specific order
 */
export const hasRatedOrder = async (buyerId, orderId) => {
  const q = query(
    collection(db, 'ratings'),
    where('buyerId', '==', buyerId),
    where('orderId', '==', orderId)
  )
  const snapshot = await getDocs(q)
  return !snapshot.empty
}

