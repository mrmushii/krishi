import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { db } from '../config/firebase'
import { uploadToCloudinary } from '../services/storageService'
import Input from '../components/Input'
import Button from '../components/Button'
import Navbar from '../components/Navbar'

export default function BuyerVerification() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tradeLicense: null,
    businessName: '',
    businessAddress: '',
    businessType: '',
    contactNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleTradeLicenseUpload = (e) => {
    setFormData({ ...formData, tradeLicense: e.target.files[0] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setUploading(true)

    try {
      const verificationData = {
        businessName: formData.businessName,
        businessAddress: formData.businessAddress,
        businessType: formData.businessType,
        contactNumber: formData.contactNumber,
        tradeLicenseUrl: null,
        verified: false,
        status: 'pending_verification',
        verificationRequestedAt: new Date().toISOString()
      }

      if (formData.tradeLicense) {
        verificationData.tradeLicenseUrl = await uploadToCloudinary(
          formData.tradeLicense,
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
      setUploading(false)
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
              />
              {formData.tradeLicense && (
                <p className="text-sm text-gray-600 mt-1">Selected: {formData.tradeLicense.name}</p>
              )}
            </div>

            <Input
              label="Business Name"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
            />

            <Input
              label="Business Address"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              required
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmlink-orange"
                required
              >
                <option value="">Select business type</option>
                <option value="retailer">Retailer</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="restaurant">Restaurant</option>
                <option value="hotel">Hotel</option>
                <option value="processor">Food Processor</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Input
              label="Contact Number"
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              placeholder="01XXXXXXXXX"
              required
            />

            <Button type="submit" disabled={loading || uploading} className="w-full">
              {uploading ? 'Uploading...' : loading ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

