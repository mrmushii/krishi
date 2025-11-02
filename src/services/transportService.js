import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createNotification } from './notificationService'

/**
 * Create a new transport request
 */
export const createTransportRequest = async (transportData) => {
  const docRef = await addDoc(collection(db, 'transports'), {
    ...transportData,
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  })

  // Notify nearby drivers about the transport request
  await notifyNearbyDrivers(docRef.id, transportData)

  return docRef.id
}

/**
 * Get transport requests for bidding
 */
export const getPendingTransportRequests = async (driverLocation = null) => {
  let q = query(
    collection(db, 'transports'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  let transports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  // If driver location is provided, calculate distances and sort
  if (driverLocation) {
    transports = transports.map(transport => {
      if (transport.pickupLocation?.lat && transport.pickupLocation?.lng) {
        const distance = calculateDistance(
          driverLocation.lat,
          driverLocation.lng,
          transport.pickupLocation.lat,
          transport.pickupLocation.lng
        )
        return { ...transport, distance }
      }
      return { ...transport, distance: Infinity }
    }).sort((a, b) => a.distance - b.distance)
  }

  return transports
}

/**
 * Place a bid on a transport request
 */
export const placeBid = async (transportId, driverId, bidAmount, driverData) => {
  const transportRef = doc(db, 'transports', transportId)
  const transportSnap = await getDoc(transportRef)

  if (!transportSnap.exists()) {
    throw new Error('Transport request not found')
  }

  const transport = transportSnap.data()

  // Check if bidding is still open
  if (transport.status !== 'pending') {
    throw new Error('Bidding is closed for this transport')
  }

  // Check if timer has expired
  if (transport.biddingEndTime && transport.biddingEndTime.toDate() < new Date()) {
    throw new Error('Bidding time has expired')
  }

  // Add bid to transport
  const bids = transport.bids || []
  const existingBidIndex = bids.findIndex(bid => bid.driverId === driverId)

  const newBid = {
    driverId,
    driverName: driverData.name,
    driverContact: driverData.contactNumber,
    vehicleNumber: driverData.vehicleNumber,
    bidAmount: parseFloat(bidAmount),
    placedAt: Timestamp.now()
  }

  if (existingBidIndex >= 0) {
    bids[existingBidIndex] = newBid
  } else {
    bids.push(newBid)
  }

  await updateDoc(transportRef, {
    bids,
    updatedAt: Timestamp.now()
  })

  return newBid
}

/**
 * Auto-assign transport to lowest bidder when timer ends
 */
export const autoAssignTransport = async (transportId) => {
  const transportRef = doc(db, 'transports', transportId)
  const transportSnap = await getDoc(transportRef)

  if (!transportSnap.exists()) return

  const transport = transportSnap.data()
  const bids = transport.bids || []

  if (bids.length === 0 || transport.status !== 'pending') return

  // Find lowest bid
  const sortedBids = [...bids].sort((a, b) => a.bidAmount - b.bidAmount)
  const winningBid = sortedBids[0]

  // Update transport status
  await updateDoc(transportRef, {
    status: 'assigned',
    assignedDriverId: winningBid.driverId,
    assignedDriverName: winningBid.driverName,
    assignedAt: Timestamp.now(),
    finalBidAmount: winningBid.bidAmount,
    updatedAt: Timestamp.now()
  })

  // Notify farmer and driver
  await createNotification({
    type: 'transport_assigned',
    title: 'Transport Assigned',
    message: `Driver ${winningBid.driverName} has been assigned to your transport request`,
    targetUserId: transport.farmerId,
    targetRole: 'farmer',
    transportId,
    metadata: {
      driverName: winningBid.driverName,
      bidAmount: winningBid.bidAmount
    }
  })

  await createNotification({
    type: 'transport_won',
    title: 'Bid Won!',
    message: `You won the transport bid for ${transport.goodsType}`,
    targetUserId: winningBid.driverId,
    targetRole: 'driver',
    transportId,
    metadata: {
      destination: transport.destination,
      bidAmount: winningBid.bidAmount
    }
  })

  // Notify other bidders
  for (const bid of bids) {
    if (bid.driverId !== winningBid.driverId) {
      await createNotification({
        type: 'bid_lost',
        title: 'Bid Result',
        message: `Another driver won the transport bid for ${transport.goodsType}`,
        targetUserId: bid.driverId,
        targetRole: 'driver',
        transportId
      })
    }
  }
}

/**
 * Update transport location (for live tracking)
 */
export const updateTransportLocation = async (transportId, location, driverId) => {
  const transportRef = doc(db, 'transports', transportId)
  const transportSnap = await getDoc(transportRef)

  if (!transportSnap.exists()) {
    throw new Error('Transport not found')
  }

  const transport = transportSnap.data()

  if (transport.assignedDriverId !== driverId) {
    throw new Error('Unauthorized: You are not assigned to this transport')
  }

  await updateDoc(transportRef, {
    currentLocation: {
      lat: location.lat,
      lng: location.lng,
      timestamp: Timestamp.now()
    },
    updatedAt: Timestamp.now()
  })

  // Store location history
  const historyRef = collection(db, 'transports', transportId, 'locationHistory')
  await addDoc(historyRef, {
    lat: location.lat,
    lng: location.lng,
    timestamp: Timestamp.now()
  })
}

/**
 * Update transport status
 */
export const updateTransportStatus = async (transportId, status, metadata = {}) => {
  const transportRef = doc(db, 'transports', transportId)
  await updateDoc(transportRef, {
    status,
    updatedAt: Timestamp.now(),
    ...metadata
  })

  // Get transport for notifications
  const transportSnap = await getDoc(transportRef)
  if (transportSnap.exists()) {
    const transport = transportSnap.data()

    // Notify relevant parties
    if (status === 'in-transit') {
      await createNotification({
        type: 'transport_started',
        title: 'Transport Started',
        message: `Transport for ${transport.goodsType} has started`,
        targetUserId: transport.farmerId,
        targetRole: 'farmer',
        transportId
      })

      if (transport.buyerId) {
        await createNotification({
          type: 'transport_started',
          title: 'Transport Started',
          message: `Your goods are on the way`,
          targetUserId: transport.buyerId,
          targetRole: 'buyer',
          transportId
        })
      }
    } else if (status === 'delivered') {
      await createNotification({
        type: 'transport_delivered',
        title: 'Transport Delivered',
        message: `Transport for ${transport.goodsType} has been delivered`,
        targetUserId: transport.farmerId,
        targetRole: 'farmer',
        transportId
      })

      if (transport.buyerId) {
        await createNotification({
          type: 'transport_delivered',
          title: 'Transport Delivered',
          message: `Your goods have been delivered`,
          targetUserId: transport.buyerId,
          targetRole: 'buyer',
          transportId
        })
      }
    }
  }
}

/**
 * Create emergency alert
 */
export const createEmergencyAlert = async (transportId, issueType, description, location, userId) => {
  const transportRef = doc(db, 'transports', transportId)
  const transportSnap = await getDoc(transportRef)

  if (!transportSnap.exists()) {
    throw new Error('Transport not found')
  }

  const transport = transportSnap.data()

  // Create emergency alert document
  const alertRef = await addDoc(collection(db, 'emergencyAlerts'), {
    transportId,
    issueType,
    description,
    location,
    reportedBy: userId,
    status: 'active',
    createdAt: Timestamp.now()
  })

  // Update transport with emergency status
  await updateDoc(transportRef, {
    emergencyAlertId: alertRef.id,
    emergencyStatus: 'active',
    updatedAt: Timestamp.now()
  })

  // Notify all relevant parties
  const recipients = [
    { userId: transport.farmerId, role: 'farmer' },
    { userId: transport.buyerId, role: 'buyer' }
  ]

  if (transport.assignedDriverId) {
    recipients.push({ userId: transport.assignedDriverId, role: 'driver' })
  }

  // Notify admins
  const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'))
  const adminSnapshot = await getDocs(adminQuery)
  adminSnapshot.docs.forEach(adminDoc => {
    recipients.push({ userId: adminDoc.id, role: 'admin' })
  })

  // Send notifications
  for (const recipient of recipients) {
    if (recipient.userId) {
      await createNotification({
        type: 'emergency_alert',
        title: '🚨 Emergency Alert',
        message: `Emergency: ${issueType} - ${description}`,
        targetUserId: recipient.userId,
        targetRole: recipient.role,
        transportId,
        emergencyAlertId: alertRef.id,
        metadata: {
          issueType,
          location
        }
      })
    }
  }

  return alertRef.id
}

/**
 * Get active transports for a user
 */
export const getUserTransports = async (userId, role) => {
  let fieldName = ''
  if (role === 'farmer') fieldName = 'farmerId'
  else if (role === 'driver') fieldName = 'assignedDriverId'
  else if (role === 'buyer') fieldName = 'buyerId'

  if (!fieldName) return []

  const q = query(
    collection(db, 'transports'),
    where(fieldName, '==', userId),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Subscribe to transport location updates (real-time)
 */
export const subscribeToTransportLocation = (transportId, callback) => {
  const transportRef = doc(db, 'transports', transportId)
  return onSnapshot(transportRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() })
    }
  })
}

/**
 * Subscribe to active transports (real-time)
 */
export const subscribeToActiveTransports = (callback) => {
  const q = query(
    collection(db, 'transports'),
    where('status', 'in', ['assigned', 'in-transit']),
    orderBy('updatedAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const transports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(transports)
  })
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

/**
 * Notify nearby drivers about transport request
 */
const notifyNearbyDrivers = async (transportId, transportData) => {
  // Get all verified drivers
  const driversQuery = query(
    collection(db, 'users'),
    where('role', '==', 'driver'),
    where('verified', '==', true)
  )

  const driversSnapshot = await getDocs(driversQuery)
  
  for (const driverDoc of driversSnapshot.docs) {
    const driver = driverDoc.data()
    await createNotification({
      type: 'new_transport_request',
      title: 'New Transport Request',
      message: `New transport request: ${transportData.goodsType} to ${transportData.destination}`,
      targetUserId: driverDoc.id,
      targetRole: 'driver',
      transportId,
      metadata: {
        goodsType: transportData.goodsType,
        destination: transportData.destination
      }
    })
  }
}

