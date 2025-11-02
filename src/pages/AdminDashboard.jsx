import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

const initialStats = {
  totalUsers: 0,
  farmers: 0,
  buyers: 0,
  agents: 0,
  products: 0,
  orders: 0,
  completedOrders: 0,
  pendingVerifications: 0,
  pendingAgents: 0
}

const percent = (part, total) => (total ? (part / total) * 100 : 0)
const formatDate = value => {
  if (!value) return 'N/A'
  if (value instanceof Date) return value.toLocaleDateString()
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleDateString()
  return new Date(value).toLocaleDateString()
}

export default function AdminDashboard() {
  const { userData, loading: authLoading } = useAuth() // ✅ include loading from useAuth
  const navigate = useNavigate()
  const [stats, setStats] = useState(initialStats)
  const [pendingAgents, setPendingAgents] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersSnap, productsSnap, ordersSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'orders'))
      ])

      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const productsCount = productsSnap.size
      const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      const userTotals = users.reduce(
        (acc, user) => {
          acc.totalUsers += 1
          if (user.role === 'farmer') acc.farmers += 1
          if (user.role === 'buyer') acc.buyers += 1
          if (user.role === 'agent') {
            acc.agents += 1
            if (!user.verified || user.status === 'pending_verification') acc.pendingAgents.push(user)
          }
          if (user.status === 'pending_verification' && user.role !== 'admin') acc.pendingVerifications += 1
          return acc
        },
        { ...initialStats, pendingAgents: [] }
      )

      const completedOrders = orders.reduce(
        (count, order) => (order.status === 'delivered' ? count + 1 : count),
        0
      )

      setStats({
        totalUsers: userTotals.totalUsers,
        farmers: userTotals.farmers,
        buyers: userTotals.buyers,
        agents: userTotals.agents,
        products: productsCount,
        orders: orders.length,
        completedOrders,
        pendingVerifications: userTotals.pendingVerifications,
        pendingAgents: userTotals.pendingAgents.length
      })
      setPendingAgents(userTotals.pendingAgents)
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ Updated useEffect with auth loading check
  useEffect(() => {
    if (authLoading) return // wait for auth to load completely
    if (!userData || userData?.role !== 'admin') {
      navigate('/')
      return
    }
    loadDashboardData()
  }, [userData, authLoading, navigate, loadDashboardData])

  const handleApproveAgent = async (agentId, action) => {
    try {
      await updateDoc(doc(db, 'users', agentId), {
        verified: action === 'approve',
        status: action === 'approve' ? 'active' : 'rejected',
        verifiedBy: 'Admin',
        verifiedAt: Timestamp.now()
      })
      alert(`Agent ${action === 'approve' ? 'approved' : 'rejected'} successfully!`)
      loadDashboardData()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-farmlink-orange mx-auto"></div>
        </div>
      </div>
    )
  }

  const farmerPercent = percent(stats.farmers, stats.totalUsers)
  const buyerPercent = percent(stats.buyers, stats.totalUsers)
  const agentPercent = percent(stats.agents, stats.totalUsers)
  const completedPercent = percent(stats.completedOrders, stats.orders)
  const pendingPercent = percent(stats.orders - stats.completedOrders, stats.orders)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Dashboard stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          {/* Farmers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Farmers</p>
                <p className="text-3xl font-bold text-green-600">{stats.farmers}</p>
              </div>
              <div className="text-4xl">🌾</div>
            </div>
          </div>

          {/* Buyers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Buyers</p>
                <p className="text-3xl font-bold text-blue-600">{stats.buyers}</p>
              </div>
              <div className="text-4xl">🛒</div>
            </div>
          </div>

          {/* Agents */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Agents</p>
                <p className="text-3xl font-bold text-purple-600">{stats.agents}</p>
              </div>
              <div className="text-4xl">👨‍💼</div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-farmlink-orange">{stats.products}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-indigo-600">{stats.orders}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed Orders</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          {/* Pending Verifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Verifications</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingVerifications}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* User Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">User Distribution</h2>
            <div className="space-y-3">
              {['Farmers', 'Buyers', 'Agents'].map((role, idx) => {
                const count = stats[role.toLowerCase()]
                const rolePercent =
                  role === 'Farmers' ? farmerPercent : role === 'Buyers' ? buyerPercent : agentPercent
                const color = role === 'Farmers' ? 'green-600' : role === 'Buyers' ? 'blue-600' : 'purple-600'
                return (
                  <div key={role}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">{role}</span>
                      <span className="text-sm font-semibold">
                        {count} ({Math.round(rolePercent)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full bg-${color}`} style={{ width: `${rolePercent}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Statistics</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Completed Orders</span>
                  <span className="text-sm font-semibold">
                    {stats.completedOrders} ({Math.round(completedPercent)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${completedPercent}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Pending Orders</span>
                  <span className="text-sm font-semibold">{stats.orders - stats.completedOrders}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${pendingPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Agent Approvals */}
        {pendingAgents.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Agent Approvals ({pendingAgents.length})</h2>
            <div className="space-y-4">
              {pendingAgents.map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{agent.name || agent.email}</h3>
                    <p className="text-sm text-gray-500">Registered: {formatDate(agent.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApproveAgent(agent.id, 'approve')}>✓ Approve</Button>
                    <Button variant="danger" onClick={() => handleApproveAgent(agent.id, 'reject')}>
                      ✗ Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
