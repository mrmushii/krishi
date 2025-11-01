import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { db } from '../config/firebase'
import Button from '../components/Button'
import Navbar from '../components/Navbar'

const PAYMENT_METHODS = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket'
}

const REGISTRATION_FEE = 500

export default function FarmerPayment() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('bkash')
  const [processing, setProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState({ phone: '', transactionId: '' })

  const paymentLabel = useMemo(
    () => PAYMENT_METHODS[paymentMethod] ?? PAYMENT_METHODS.bkash,
    [paymentMethod]
  )

  const handleInputChange = useCallback(({ target: { name, value } }) => {
    setPaymentData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handlePayment = useCallback(async () => {
    if (!user?.uid) {
      alert('User not found. Please sign in again.')
      return
    }
    if (!paymentData.phone.trim()) {
      alert('Please enter your bKash number')
      return
    }

    setProcessing(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await updateDoc(doc(db, 'users', user.uid), {
        registrationPaid: true,
        paymentMethod,
        paymentPhone: paymentData.phone.trim(),
        paymentTransactionId: paymentData.transactionId.trim() || `TXN${Date.now()}`,
        paymentDate: new Date().toISOString(),
        status: 'pending_verification',
        registrationFee: REGISTRATION_FEE
      })

      alert('Payment successful! Your registration is now pending agent verification.')
      navigate('/onboarding')
    } catch (err) {
      alert(`Payment error: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }, [navigate, paymentData.phone, paymentData.transactionId, paymentMethod, user?.uid])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-2">Farmer Registration Payment</h1>
          <p className="text-gray-600 mb-6">
            Pay a one-time registration fee of{' '}
            <span className="font-bold text-deshbazar-primary">৳{REGISTRATION_FEE}</span> to complete your registration.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deshbazar-primary"
            >
              {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {paymentLabel} Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={paymentData.phone}
              onChange={handleInputChange}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deshbazar-primary"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction ID (Optional)
            </label>
            <input
              type="text"
              name="transactionId"
              value={paymentData.transactionId}
              onChange={handleInputChange}
              placeholder="Enter transaction ID if available"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deshbazar-primary"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Demo Payment:</strong> This is a hackathon demo. No real payment will be processed.
              Just enter any phone number and click "Complete Payment".
            </p>
          </div>

          <div className="flex gap-4">
            <Button onClick={handlePayment} disabled={processing} className="flex-1">
              {processing ? 'Processing Payment...' : `Pay ৳${REGISTRATION_FEE}`}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/')} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
