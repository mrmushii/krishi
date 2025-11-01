import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

export default function AdminDashboard() {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    farmers: 0,
    buyers: 0,
    agents: 0,
    products: 0,
    orders: 0,
    completedOrders: 0,
    pendingVerifications: 0,
    pendingAgents: 0
  })
  const [pendingAgents, setPendingAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userData?.role !== 'admin') {
      navigate('/')
      return
    }
    loadDashboardData()
  }, [userData])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load all collections
      const [usersSnap, productsSnap, ordersSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'orders'))
      ])

      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Calculate statistics
      const farmers = users.filter(u => u.role === 'farmer')
      const buyers = users.filter(u => u.role === 'buyer')
      const agents = users.filter(u => u.role === 'agent')
      const pendingAgentsList = agents.filter(u => !u.verified || u.status === 'pending_verification')
      const pendingVerifications = users.filter(u => 
        u.status === 'pending_verification' && u.role !== 'admin'
      ).length

      setStats({
        totalUsers: users.length,
        farmers: farmers.length,
        buyers: buyers.length,
        agents: agents.length,
        products: products.length,
        orders: orders.length,
        completedOrders: orders.filter(o => o.status === 'delivered').length,
        pendingVerifications,
        pendingAgents: pendingAgentsList.length
      })

      setPendingAgents(pendingAgentsList)
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-farmlink-orange mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Farmers</p>
                <p className="text-3xl font-bold text-green-600">{stats.farmers}</p>
              </div>
              <div className="text-4xl">🌾</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Buyers</p>
                <p className="text-3xl font-bold text-blue-600">{stats.buyers}</p>
              </div>
              <div className="text-4xl">🛒</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Agents</p>
                <p className="text-3xl font-bold text-purple-600">{stats.agents}</p>
              </div>
              <div className="text-4xl">👨‍💼</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-farmlink-orange">{stats.products}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-indigo-600">{stats.orders}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed Orders</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">User Distribution</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Farmers</span>
                  <span className="text-sm font-semibold">{stats.farmers} ({((stats.farmers / stats.totalUsers) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(stats.farmers / stats.totalUsers) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Buyers</span>
                  <span className="text-sm font-semibold">{stats.buyers} ({((stats.buyers / stats.totalUsers) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats.buyers / stats.totalUsers) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Agents</span>
                  <span className="text-sm font-semibold">{stats.agents} ({((stats.agents / stats.totalUsers) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(stats.agents / stats.totalUsers) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Statistics</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Completed Orders</span>
                  <span className="text-sm font-semibold">{stats.completedOrders} ({((stats.completedOrders / stats.orders) * 100 || 0).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(stats.completedOrders / stats.orders) * 100 || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Pending Orders</span>
                  <span className="text-sm font-semibold">{stats.orders - stats.completedOrders}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${((stats.orders - stats.completedOrders) / stats.orders) * 100 || 0}%` }}></div>
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
                    <p className="text-sm text-gray-500">Registered: {new Date(agent.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproveAgent(agent.id, 'approve')}
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleApproveAgent(agent.id, 'reject')}
                    >
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

