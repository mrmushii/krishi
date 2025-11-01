import { useState, useEffect } from 'react'
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

  useEffect(() => {
    loadOrders()
  }, [user, userData])

  const loadOrders = async () => {
    if (!user || !userData) return
    
    let q
    if (userData.role === 'buyer') {
      q = query(
        collection(db, 'orders'),
        where('buyerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
    } else if (userData.role === 'farmer') {
      q = query(
        collection(db, 'orders'),
        where('farmerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
    } else {
      return
    }

    const snapshot = await getDocs(q)
    setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      loadOrders()
    } catch (err) {
      alert('Error updating order: ' + err.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'in-transit': return 'bg-blue-100 text-blue-800'
      case 'packed': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
                <Button onClick={() => navigate('/marketplace')}>
                  Browse Marketplace
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
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
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="font-semibold">{order.quantity} {order.unit}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Unit Price</p>
                    <p className="font-semibold">৳{order.unitPrice?.toFixed(2) || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Price</p>
                    <p className="font-semibold">৳{order.totalPrice?.toFixed(2) || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-semibold">
                      {order.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                    </p>
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

                {userData?.role === 'farmer' && order.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'accepted')}
                      className="flex-1"
                    >
                      Accept Order
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => updateOrderStatus(order.id, 'rejected')}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {userData?.role === 'farmer' && order.status === 'accepted' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'packed')}
                    className="w-full"
                  >
                    Mark as Packed
                  </Button>
                )}

                {userData?.role === 'farmer' && order.status === 'packed' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'in-transit')}
                    className="w-full"
                  >
                    Mark as Shipped
                  </Button>
                )}

                {userData?.role === 'farmer' && order.status === 'in-transit' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="w-full"
                  >
                    Mark as Delivered
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

