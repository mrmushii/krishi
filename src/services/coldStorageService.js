import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Create a cold storage rental request
 */
export const createColdStorageRental = async (rentalData) => {
  const docRef = await addDoc(collection(db, 'coldStorageRentals'), {
    ...rentalData,
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  })

  return docRef.id
}

/**
 * Get cold storage rentals for a farmer
 */
export const getFarmerColdStorageRentals = async (farmerId) => {
  const q = query(
    collection(db, 'coldStorageRentals'),
    where('farmerId', '==', farmerId),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Get all cold storage rentals (for admin)
 */
export const getAllColdStorageRentals = async () => {
  const q = query(
    collection(db, 'coldStorageRentals'),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Add goods to cold storage
 */
export const addGoodsToStorage = async (rentalId, goodsData) => {
  const rentalRef = doc(db, 'coldStorageRentals', rentalId)
  const rentalSnap = await getDoc(rentalRef)

  if (!rentalSnap.exists()) {
    throw new Error('Cold storage rental not found')
  }

  const rental = rentalSnap.data()
  const storedGoods = rental.storedGoods || []

  storedGoods.push({
    ...goodsData,
    storedAt: Timestamp.now()
  })

  await updateDoc(rentalRef, {
    storedGoods,
    updatedAt: Timestamp.now()
  })

  return storedGoods
}

/**
 * Update cold storage rental status
 */
export const updateColdStorageRentalStatus = async (rentalId, status) => {
  await updateDoc(doc(db, 'coldStorageRentals', rentalId), {
    status,
    updatedAt: Timestamp.now()
  })
}

/**
 * Get cold storage utilization statistics
 */
export const getColdStorageStats = async () => {
  const q = query(collection(db, 'coldStorageRentals'))
  const snapshot = await getDocs(q)
  
  const rentals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  
  const stats = {
    totalRentals: rentals.length,
    activeRentals: rentals.filter(r => r.status === 'active').length,
    totalCapacity: rentals.reduce((sum, r) => sum + (r.capacity || 0), 0),
    utilizedCapacity: rentals.reduce((sum, r) => {
      const stored = r.storedGoods?.reduce((s, g) => s + (g.quantity || 0), 0) || 0
      return sum + stored
    }, 0)
  }

  return stats
}

