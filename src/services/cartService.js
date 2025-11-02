import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Add item to cart
 */
export const addToCart = async (cartItem) => {
  // Validate inventory (optional - can check product availability)
  // Note: Full validation should happen at checkout
  
  // Check if item already in cart
  const existingQuery = query(
    collection(db, 'cart'),
    where('userId', '==', cartItem.userId),
    where('productId', '==', cartItem.productId)
  )
  const existing = await getDocs(existingQuery)
  
  if (!existing.empty) {
    // Update quantity
    const cartDoc = existing.docs[0]
    const currentQty = cartDoc.data().quantity || 0
    const newQty = currentQty + (cartItem.quantity || 1)
    
    await updateDoc(doc(db, 'cart', cartDoc.id), {
      quantity: newQty,
      updatedAt: Timestamp.now()
    })
    return cartDoc.id
  } else {
    // Add new item
    const docRef = await addDoc(collection(db, 'cart'), {
      ...cartItem,
      quantity: cartItem.quantity || 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    return docRef.id
  }
}

/**
 * Get user's cart items
 */
export const getCartItems = async (userId) => {
  const q = query(
    collection(db, 'cart'),
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Remove item from cart
 */
export const removeFromCart = async (cartId) => {
  await deleteDoc(doc(db, 'cart', cartId))
}

/**
 * Update cart item quantity
 */
export const updateCartQuantity = async (cartId, quantity) => {
  if (quantity <= 0) {
    await removeFromCart(cartId)
  } else {
    await updateDoc(doc(db, 'cart', cartId), {
      quantity,
      updatedAt: Timestamp.now()
    })
  }
}

/**
 * Clear cart
 */
export const clearCart = async (userId) => {
  const items = await getCartItems(userId)
  for (const item of items) {
    await removeFromCart(item.id)
  }
}

/**
 * Add to wishlist
 */
export const addToWishlist = async (wishlistItem) => {
  // Check if already in wishlist
  const existingQuery = query(
    collection(db, 'wishlist'),
    where('userId', '==', wishlistItem.userId),
    where('productId', '==', wishlistItem.productId)
  )
  const existing = await getDocs(existingQuery)
  
  if (existing.empty) {
    const docRef = await addDoc(collection(db, 'wishlist'), {
      ...wishlistItem,
      createdAt: Timestamp.now()
    })
    return docRef.id
  }
  return null
}

/**
 * Get user's wishlist
 */
export const getWishlistItems = async (userId) => {
  const q = query(
    collection(db, 'wishlist'),
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Remove from wishlist
 */
export const removeFromWishlist = async (wishlistId) => {
  await deleteDoc(doc(db, 'wishlist', wishlistId))
}

