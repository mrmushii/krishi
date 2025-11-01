import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { db } from '../config/firebase'
import { uploadToCloudinary } from '../services/storageService'
import Input from '../components/Input'
import Button from '../components/Button'
import Navbar from '../components/Navbar'

const initialFormData = {
  tradeLicense: null,
  businessName: '',
  businessAddress: '',
  businessType: '',
  contactNumber: ''
}

export default function BuyerVerification() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialFormData)
  const [loading, setLoading] = useState(false)

  const businessTypes = useMemo(
    () => [
      { value: '', label: 'Select business type' },
      { value: 'retailer', label: 'Retailer' },
      { value: 'wholesaler', label: 'Wholesaler' },
      { value: 'restaurant', label: 'Restaurant' },
      { value: 'hotel', label: 'Hotel' },
      { value: 'processor', label: 'Food Processor' },
      { value: 'other', label: 'Other' }
    ],
    []
  )

  const handleChange = ({ target: { name, value } }) =>
    setFormData((prev) => ({ ...prev, [name]: value }))

  const handleTradeLicenseUpload = ({ target: { files } }) => {
    if (!files?.length) return
    setFormData((prev) => ({ ...prev, tradeLicense: files[0] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.uid) return
    setLoading(true)

    try {
      const { tradeLicense, ...rest } = formData
      const verificationData = {
        ...rest,
        verified: false,
        status: 'pending_verification',
        verificationRequestedAt: new Date().toISOString()
      }

      if (tradeLicense) {
        verificationData.tradeLicenseUrl = await uploadToCloudinary(
          tradeLicense,
          `buyers/${user.uid}/verification`
        )
      }

      await updateDoc(doc(db, 'users', user.uid), verificationData)

      alert('Verification request submitted! Your account will be reviewed by an agent.')
      navigate('/')
    } catch (err) {
      alert('Error submitting verification: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-2">Buyer Verification</h1>
          <p className="text-gray-600 mb-6">
            Complete your verification to start purchasing. Only verified buyers can place orders.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trade License <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleTradeLicenseUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              />
              {formData.tradeLicense && (
                <p className="text-sm text-gray-600 mt-1">Selected: {formData.tradeLicense.name}</p>
              )}
            </div>

            <Input
              name="businessName"
              label="Business Name"
              value={formData.businessName}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <Input
              name="businessAddress"
              label="Business Address"
              value={formData.businessAddress}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmlink-orange"
                required
                disabled={loading}
              >
                {businessTypes.map(({ value, label }) => (
                  <option key={value || 'placeholder'} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              name="contactNumber"
              label="Contact Number"
              type="tel"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              required
              disabled={loading}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
