import { useState, useEffect, useCallback, useMemo } from 'react'
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import Navbar from '../components/Navbar'

export default function Orders() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])

  const loadOrders = useCallback(async () => {
    if (!user || !userData?.role) return

    const field = userData.role === 'buyer' ? 'buyerId' : userData.role === 'farmer' ? 'farmerId' : null
    if (!field) return

    const q = query(
      collection(db, 'orders'),
      where(field, '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    setOrders(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })))
  }, [user, userData])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const updateOrderStatus = useCallback(
    async (orderId, newStatus) => {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
        loadOrders()
      } catch (err) {
        alert('Error updating order: ' + err.message)
      }
    },
    [loadOrders]
  )

  const statusStyles = useMemo(
    () => ({
      delivered: 'bg-green-100 text-green-800',
      'in-transit': 'bg-blue-100 text-blue-800',
      packed: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-purple-100 text-purple-800'
    }),
    []
  )

  const actionsByRole = useMemo(
    () => ({
      farmer: {
        pending: [
          { label: 'Accept Order', handler: (order) => updateOrderStatus(order.id, 'accepted') },
          {
            label: 'Reject',
            handler: (order) => updateOrderStatus(order.id, 'rejected'),
            variant: 'danger'
          }
        ],
        accepted: [{ label: 'Mark as Packed', handler: (order) => updateOrderStatus(order.id, 'packed') }],
        packed: [{ label: 'Mark as Shipped', handler: (order) => updateOrderStatus(order.id, 'in-transit') }],
        'in-transit': [{ label: 'Mark as Delivered', handler: (order) => updateOrderStatus(order.id, 'delivered') }]
      },
      buyer: {
        delivered: [{ label: 'Rate Farmer', handler: (order) => navigate(`/rate-farmer/${order.id}`) }]
      }
    }),
    [navigate, updateOrderStatus]
  )

  const renderActions = (order) => {
    const role = userData?.role
    const actions = role ? actionsByRole[role]?.[order.status] : null
    if (!actions?.length) return null

    const isSingleButton = actions.length === 1

    return (
      <div className={isSingleButton ? 'w-full' : 'flex gap-2'}>
        {actions.map(({ label, handler, variant }, idx) => (
          <Button
            key={label}
            onClick={() => handler(order)}
            variant={variant}
            className={isSingleButton ? 'w-full' : 'flex-1'}
          >
            {label}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No orders yet
            {userData?.role === 'buyer' && (
              <div className="mt-4">
                <Button onClick={() => navigate('/marketplace')}>Browse Marketplace</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusClass = statusStyles[order.status] ?? 'bg-gray-100 text-gray-800'
              const createdAt = order.createdAt?.toDate?.()?.toLocaleDateString?.() ?? 'N/A'

              return (
                <div key={order.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{order.productName}</h3>
                      {userData?.role === 'buyer' && (
                        <p className="text-gray-600">Farmer: {order.farmerName}</p>
                      )}
                      {userData?.role === 'farmer' && (
                        <p className="text-gray-600">Buyer: {order.buyerName}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm capitalize ${statusClass}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p className="font-semibold">
                        {order.quantity} {order.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Unit Price</p>
                      <p className="font-semibold">৳{order.unitPrice?.toFixed?.(2) ?? '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Price</p>
                      <p className="font-semibold">৳{order.totalPrice?.toFixed?.(2) ?? '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-semibold">{createdAt}</p>
                    </div>
                  </div>

                  {order.coldStorage && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ✓ Cold Storage Booked ({order.subscriptionPlan || 'N/A'})
                      </p>
                    </div>
                  )}

                  {order.paymentHeld && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        💰 Payment held in escrow until delivery
                      </p>
                    </div>
                  )}

                  {renderActions(order)}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
