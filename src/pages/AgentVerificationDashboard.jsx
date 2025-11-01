import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

const ROLE_CONFIG = [
  { key: 'farmers', role: 'farmer' },
  { key: 'buyers', role: 'buyer' }
]

export default function AgentVerificationDashboard() {
  const { userData } = useAuth()
  const [users, setUsers] = useState({ farmers: [], buyers: [] })
  const [activeTab, setActiveTab] = useState('farmers')

  const loadPendingUsers = useCallback(async () => {
    try {
      const snapshots = await Promise.all(
        ROLE_CONFIG.map(({ role }) =>
          getDocs(
            query(
              collection(db, 'users'),
              where('role', '==', role),
              where('status', '==', 'pending_verification')
            )
          )
        )
      )

      setUsers(
        snapshots.reduce((acc, snapshot, index) => {
          const key = ROLE_CONFIG[index].key
          acc[key] = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
          return acc
        }, { farmers: [], buyers: [] })
      )
    } catch (err) {
      console.error('Failed to load pending users', err)
    }
  }, [])

  useEffect(() => {
    loadPendingUsers()
  }, [loadPendingUsers])

  const handleVerify = async (userId, type, action) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        verified: action === 'approve',
        status: action === 'approve' ? 'active' : 'rejected',
        verifiedBy: userData?.name || 'Agent',
        verifiedAt: Timestamp.now(),
        verificationNotes: action === 'approve' ? 'Approved by agent' : 'Rejected by agent'
      })

      const listKey = type === 'farmer' ? 'farmers' : 'buyers'
      setUsers(prev => ({
        ...prev,
        [listKey]: prev[listKey].filter(user => user.id !== userId)
      }))

      alert(`${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const activeList = users[activeTab]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Dashboard</h1>
          <p className="text-gray-600">Review and approve farmer and buyer registrations</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('farmers')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'farmers'
                ? 'bg-deshbazar-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Farmers ({users.farmers.length})
          </button>
          <button
            onClick={() => setActiveTab('buyers')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'buyers'
                ? 'bg-deshbazar-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Buyers ({users.buyers.length})
          </button>
        </div>

        {activeTab === 'farmers' && (
          <div className="space-y-4">
            {activeList.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500">No pending farmer verifications</p>
              </div>
            ) : (
              activeList.map(farmer => (
                <div key={farmer.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{farmer.name || farmer.email}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Farm Location</p>
                          <p className="font-medium">{farmer.farmLocation || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Farm Address</p>
                          <p className="font-medium">{farmer.farmAddress || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Payment Status</p>
                          <p className="font-medium text-green-600">
                            {farmer.registrationPaid
                              ? '✓ Paid (৳' + (farmer.registrationFee || 500) + ')'
                              : 'Not Paid'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Payment Method</p>
                          <p className="font-medium">{farmer.paymentMethod || 'N/A'}</p>
                        </div>
                      </div>

                      {farmer.idCardUrl && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">ID Card</p>
                          <img src={farmer.idCardUrl} alt="ID Card" className="max-w-xs rounded-lg border" />
                        </div>
                      )}

                      {farmer.cropPhotoUrls?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Crop Photos</p>
                          <div className="grid grid-cols-3 gap-2">
                            {farmer.cropPhotoUrls.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Crop ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <Button
                        onClick={() => handleVerify(farmer.id, 'farmer', 'approve')}
                        className="w-full"
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleVerify(farmer.id, 'farmer', 'reject')}
                        className="w-full"
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'buyers' && (
          <div className="space-y-4">
            {activeList.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500">No pending buyer verifications</p>
              </div>
            ) : (
              activeList.map(buyer => (
                <div key={buyer.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{buyer.name || buyer.email}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Business Name</p>
                          <p className="font-medium">{buyer.businessName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Business Type</p>
                          <p className="font-medium">{buyer.businessType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Business Address</p>
                          <p className="font-medium">{buyer.businessAddress || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Contact Number</p>
                          <p className="font-medium">{buyer.contactNumber || 'N/A'}</p>
                        </div>
                      </div>

                      {buyer.tradeLicenseUrl && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Trade License</p>
                          <img src={buyer.tradeLicenseUrl} alt="Trade License" className="max-w-xs rounded-lg border" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <Button
                        onClick={() => handleVerify(buyer.id, 'buyer', 'approve')}
                        className="w-full"
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleVerify(buyer.id, 'buyer', 'reject')}
                        className="w-full"
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
