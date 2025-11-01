import { useCallback, useEffect, useMemo, useState } from 'react'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import { formatPrice } from '../utils/priceFreshness'

export default function BuyerLedger() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTransactions = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'orders'),
        where('buyerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const stats = useMemo(() => {
    const totals = transactions.reduce(
      (acc, order) => {
        const total = order.totalPrice || 0
        acc.totalAmount += total
        if (order.status !== 'delivered' && order.paymentHeld) acc.pendingPayments += total
        return acc
      },
      { totalAmount: 0, pendingPayments: 0 }
    )
    return {
      totalPurchases: transactions.length,
      totalAmount: totals.totalAmount,
      pendingPayments: totals.pendingPayments
    }
  }, [transactions])

  const exportLedger = useCallback(() => {
    const csvRows = [
      ['Date', 'Order ID', 'Product', 'Farmer', 'Quantity', 'Unit Price', 'Total Price', 'Status', 'Payment Status'],
      ...transactions.map(order => [
        order.createdAt?.toDate().toLocaleDateString() || 'N/A',
        order.id,
        order.productName || '',
        order.farmerName || '',
        `${order.quantity || 0} ${order.unit || ''}`.trim(),
        order.unitPrice || 0,
        order.totalPrice || 0,
        order.status || '',
        order.paymentHeld ? 'Held in Escrow' : 'Completed'
      ])
    ]
    const blob = new Blob([csvRows.map(row => row.join(',')).join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ledger_${new Date().toISOString().split('T')[0]}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [transactions])

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'in-transit': return 'bg-blue-100 text-blue-800'
      case 'packed': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-farmlink-orange mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Ledger</h1>
          <Button onClick={exportLedger} variant="outline">
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard label="Total Purchases" value={stats.totalPurchases} />
          <StatCard label="Total Amount" value={formatPrice(stats.totalAmount)} highlight />
          <StatCard label="Pending Payments" value={formatPrice(stats.pendingPayments)} warning />
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Order ID', 'Product', 'Farmer', 'Quantity', 'Unit Price', 'Total', 'Status', 'Payment'].map(header => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <LedgerCell>{order.createdAt?.toDate().toLocaleDateString() || 'N/A'}</LedgerCell>
                      <LedgerCell className="text-gray-500">{order.id?.slice(0, 8)}...</LedgerCell>
                      <LedgerCell className="font-medium text-gray-900">{order.productName}</LedgerCell>
                      <LedgerCell className="text-gray-500">{order.farmerName}</LedgerCell>
                      <LedgerCell className="text-gray-500">
                        {order.quantity} {order.unit}
                      </LedgerCell>
                      <LedgerCell className="text-gray-500">
                        {formatPrice(order.unitPrice || 0)}
                      </LedgerCell>
                      <LedgerCell className="font-semibold text-gray-900">
                        {formatPrice(order.totalPrice || 0)}
                      </LedgerCell>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <LedgerCell>
                        {order.paymentHeld ? (
                          <span className="text-yellow-600">💰 Held</span>
                        ) : (
                          <span className="text-green-600">✓ Paid</span>
                        )}
                      </LedgerCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight, warning }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p
        className={`text-3xl font-bold ${
          highlight ? 'text-farmlink-orange' : warning ? 'text-yellow-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function LedgerCell({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>
      {children ?? '—'}
    </td>
  )
}
