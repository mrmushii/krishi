import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import Input from '../components/Input'
import Navbar from '../components/Navbar'

const STATUS_STYLES = {
  delivered: 'bg-green-100 text-green-800',
  'in-transit': 'bg-blue-100 text-blue-800',
  packed: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-purple-100 text-purple-800',
  default: 'bg-gray-100 text-gray-800'
}

const STATUS_FLOW = {
  pending: { label: 'Accept', next: 'accepted' },
  accepted: { label: 'Mark Packed', next: 'packed' },
  packed: { label: 'Ship', next: 'in-transit' },
  'in-transit': { label: 'Deliver', next: 'delivered' }
}

export default function AgentDashboard() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [announcementText, setAnnouncementText] = useState('')
  const [targetRole, setTargetRole] = useState('all')

  const loadOrders = useCallback(async () => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    setOrders(snapshot.docs.map(orderDoc => ({ id: orderDoc.id, ...orderDoc.data() })))
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const updateOrderStatus = useCallback(
    async (orderId, newStatus) => {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status: newStatus,
          updatedAt: Timestamp.now()
        })
        loadOrders()
      } catch (err) {
        alert(`Error updating order: ${err.message}`)
      }
    },
    [loadOrders]
  )

  const sendAnnouncement = useCallback(async () => {
    if (!announcementText.trim()) return
    try {
      await addDoc(collection(db, 'announcements'), {
        text: announcementText.trim(),
        targetRole,
        createdBy: user.uid,
        createdByName: userData?.name || user.email,
        createdAt: Timestamp.now()
      })
      alert('Announcement sent!')
      setAnnouncementText('')
      setShowAnnouncement(false)
    } catch (err) {
      alert(`Error sending announcement: ${err.message}`)
    }
  }, [announcementText, targetRole, user, userData])

  const exportLedger = useCallback(() => {
    const csvRows = [
      ['Order ID', 'Product', 'Farmer', 'Buyer', 'Quantity', 'Unit Price', 'Total Price', 'Status', 'Date']
    ]

    orders.forEach(order => {
      csvRows.push([
        order.id,
        order.productName || '',
        order.farmerName || '',
        order.buyerName || '',
        order.quantity ?? 0,
        order.unitPrice ?? 0,
        order.totalPrice ?? 0,
        order.status || '',
        order.createdAt?.toDate().toLocaleString() || ''
      ])
    })

    const csvContent = csvRows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ledger_${new Date().toISOString().split('T')[0]}.csv`
    anchor.click()
    window.URL.revokeObjectURL(url)
  }, [orders])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {userData?.name || user?.email}</h2>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/agent/verification')}>Verification Dashboard</Button>
            <Button onClick={() => setShowAnnouncement(true)}>Send Announcement</Button>
            <Button variant="outline" onClick={exportLedger}>
              Export Ledger (CSV)
            </Button>
          </div>
        </div>

        {showAnnouncement && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Send Announcement</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Users</option>
                <option value="farmer">Farmers Only</option>
                <option value="buyer">Buyers Only</option>
              </select>
            </div>
            <textarea
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value)}
              placeholder="Enter announcement text..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              rows="4"
            />
            <div className="flex gap-2">
              <Button onClick={sendAnnouncement}>Send</Button>
              <Button variant="secondary" onClick={() => setShowAnnouncement(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">All Orders</h2>

          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Order ID</th>
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2">Farmer</th>
                    <th className="text-left p-2">Buyer</th>
                    <th className="text-left p-2">Quantity</th>
                    <th className="text-left p-2">Total</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const buttonConfig = STATUS_FLOW[order.status]
                    const badgeClass = STATUS_STYLES[order.status] || STATUS_STYLES.default
                    const totalPrice = Number(order.totalPrice ?? 0).toFixed(2)

                    return (
                      <tr key={order.id} className="border-b">
                        <td className="p-2 text-sm">{order.id.substring(0, 8)}...</td>
                        <td className="p-2">{order.productName}</td>
                        <td className="p-2">{order.farmerName}</td>
                        <td className="p-2">{order.buyerName}</td>
                        <td className="p-2">
                          {order.quantity} {order.unit}
                        </td>
                        <td className="p-2">৳{totalPrice}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${badgeClass}`}>{order.status}</span>
                        </td>
                        <td className="p-2">
                          {buttonConfig && (
                            <Button
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, buttonConfig.next)}
                              className="text-xs px-2 py-1"
                            >
                              {buttonConfig.label}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
