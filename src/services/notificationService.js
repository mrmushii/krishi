import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Create a notification
 */
export const createNotification = async (notificationData) => {
  const docRef = await addDoc(collection(db, 'notifications'), {
    ...notificationData,
    read: false,
    createdAt: Timestamp.now()
  })
  return docRef.id
}

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId, unreadOnly = false) => {
  let q = query(
    collection(db, 'notifications'),
    where('targetUserId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  if (unreadOnly) {
    q = query(q, where('read', '==', false))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Get notifications for a role
 */
export const getRoleNotifications = async (role, userId) => {
  const q = query(
    collection(db, 'notifications'),
    where('targetRole', '==', role),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
  await updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
    readAt: Timestamp.now()
  })
}

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  const notifications = await getUserNotifications(userId, true)
  for (const notification of notifications) {
    await markAsRead(notification.id)
  }
}

/**
 * Send announcement (creates notifications for targeted users)
 */
export const sendAnnouncement = async (announcement) => {
  const announcementDoc = await addDoc(collection(db, 'announcements'), {
    ...announcement,
    createdAt: Timestamp.now()
  })

  // Create notifications for targeted users
  if (announcement.targetRole === 'all') {
    // Create general notification (users will query by targetRole)
    await createNotification({
      type: 'announcement',
      title: 'New Announcement',
      message: announcement.text,
      targetRole: 'all',
      announcementId: announcementDoc.id,
      createdBy: announcement.createdBy
    })
  } else {
    // Create notification for specific role
    await createNotification({
      type: 'announcement',
      title: 'New Announcement',
      message: announcement.text,
      targetRole: announcement.targetRole,
      announcementId: announcementDoc.id,
      createdBy: announcement.createdBy
    })
  }

  return announcementDoc.id
}

/**
 * Notify farmer of new order
 */
export const notifyFarmerOfOrder = async (order) => {
  await createNotification({
    type: 'new_order',
    title: 'New Order Received',
    message: `${order.buyerName} ordered ${order.quantity} ${order.unit} of ${order.productName}`,
    targetUserId: order.farmerId,
    targetRole: 'farmer',
    orderId: order.id,
    metadata: {
      productName: order.productName,
      quantity: order.quantity,
      buyerName: order.buyerName
    }
  })
}

/**
 * Notify buyer of order status change
 */
export const notifyBuyerOfOrderUpdate = async (order, newStatus) => {
  const statusMessages = {
    'accepted': 'Your order has been accepted by the farmer',
    'packed': 'Your order is packed and ready for shipment',
    'in-transit': 'Your order is on the way',
    'delivered': 'Your order has been delivered',
    'cancelled': 'Your order has been cancelled'
  }

  await createNotification({
    type: 'order_status',
    title: 'Order Update',
    message: statusMessages[newStatus] || `Order status updated to ${newStatus}`,
    targetUserId: order.buyerId,
    targetRole: 'buyer',
    orderId: order.id,
    metadata: {
      productName: order.productName,
      status: newStatus
    }
  })
}

/**
 * Notify user of order cancellation
 */
export const notifyOrderCancellation = async (order, reason) => {
  // Notify farmer
  await createNotification({
    type: 'order_cancelled',
    title: 'Order Cancelled',
    message: `Order for ${order.productName} has been cancelled. Reason: ${reason}`,
    targetUserId: order.farmerId,
    targetRole: 'farmer',
    orderId: order.id
  })

  // Notify buyer
  await createNotification({
    type: 'order_cancelled',
    title: 'Order Cancelled',
    message: `Your order for ${order.productName} has been cancelled. Reason: ${reason}`,
    targetUserId: order.buyerId,
    targetRole: 'buyer',
    orderId: order.id
  })
}

/**
 * Subscribe to real-time notifications for a user
 */
export const subscribeToNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('targetUserId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(notifications)
  })
}

/**
 * Subscribe to role-based notifications
 */
export const subscribeToRoleNotifications = (role, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('targetRole', '==', role),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(notifications)
  })
}

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId) => {
  const notifications = await getUserNotifications(userId, true)
  return notifications.length
}

