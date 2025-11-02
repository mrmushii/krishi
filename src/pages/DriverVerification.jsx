import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { uploadToCloudinary } from '../services/storageService'
import Button from '../components/Button'
import Input from '../components/Input'
import Navbar from '../components/Navbar'

export default function DriverVerification() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    contactNumber: '',
    vehicleNumber: '',
    vehicleType: 'truck',
    licenseNumber: '',
    licenseExpiry: '',
    licenseImage: null,
    address: ''
  })
  const [licensePreview, setLicensePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleLicenseUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setFormData(prev => ({ ...prev, licenseImage: file }))
      setLicensePreview(URL.createObjectURL(file))
      setError('')
    }
  }, [])

  const validateLicense = useCallback(() => {
    if (!formData.licenseNumber) return { valid: false, error: 'License number is required' }
    if (!formData.licenseExpiry) return { valid: false, error: 'License expiry date is required' }
    
    const expiryDate = new Date(formData.licenseExpiry)
    const today = new Date()
    if (expiryDate <= today) {
      return { valid: false, error: 'License has expired' }
    }
    
    // Basic format validation (can be enhanced)
    if (formData.licenseNumber.length < 5) {
      return { valid: false, error: 'Invalid license number format' }
    }
    
    return { valid: true }
  }, [formData])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate all fields
      if (!formData.contactNumber || !formData.vehicleNumber || !formData.address) {
        setError('Please fill all required fields')
        setLoading(false)
        return
      }

      // Validate license
      const licenseValidation = validateLicense()
      if (!licenseValidation.valid) {
        setError(licenseValidation.error)
        setLoading(false)
        return
      }

      if (!formData.licenseImage) {
        setError('Please upload driving license')
        setLoading(false)
        return
      }

      // Upload license image
      const licenseImageUrl = await uploadToCloudinary(
        formData.licenseImage,
        `licenses/${user.uid}`
      )

      // Update user document with driver details
      await updateDoc(doc(db, 'users', user.uid), {
        ...userData,
        contactNumber: formData.contactNumber,
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        licenseImageUrl,
        address: formData.address,
        driverVerificationStatus: 'pending',
        driverVerificationSubmittedAt: Timestamp.now(),
        verified: false // Will be set to true by admin
      })

      alert('Driver verification submitted! Admin will review your application.')
      navigate('/driver')
    } catch (err) {
      setError(err.message || 'Failed to submit verification')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [formData, user, userData, navigate, validateLicense])

  if (!userData || userData.role !== 'driver') {
    navigate('/')
    return null
  }

  if (userData.driverVerificationStatus === 'approved' && userData.verified) {
    navigate('/driver')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Driver Verification</h2>
          {userData.driverVerificationStatus === 'pending' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                Your verification is pending. Please wait for admin approval.
              </p>
            </div>
          )}
          
          {userData.driverVerificationStatus === 'rejected' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                Your verification was rejected. Please review your information and resubmit.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Contact Number"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              disabled={userData.driverVerificationStatus === 'pending'}
            />

            <Input
              label="Vehicle Number"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              required
              disabled={userData.driverVerificationStatus === 'pending'}
              placeholder="e.g., ABC-1234"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={userData.driverVerificationStatus === 'pending'}
              >
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="pickup">Pickup</option>
                <option value="refrigerated">Refrigerated Truck</option>
              </select>
            </div>

            <Input
              label="Driving License Number"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              required
              disabled={userData.driverVerificationStatus === 'pending'}
            />

            <Input
              label="License Expiry Date"
              name="licenseExpiry"
              type="date"
              value={formData.licenseExpiry}
              onChange={handleChange}
              required
              disabled={userData.driverVerificationStatus === 'pending'}
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Driving License <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLicenseUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={userData.driverVerificationStatus === 'pending'}
              />
              {licensePreview && (
                <div className="mt-2">
                  <img
                    src={licensePreview}
                    alt="License preview"
                    className="w-full max-w-md h-48 object-contain border rounded-lg"
                  />
                </div>
              )}
            </div>

            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              disabled={userData.driverVerificationStatus === 'pending'}
            />

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {userData.driverVerificationStatus !== 'pending' && (
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

