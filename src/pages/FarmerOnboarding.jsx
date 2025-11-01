import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { db } from '../config/firebase'
import { uploadID, uploadCropPhoto } from '../services/storageService'
import Input from '../components/Input'
import Button from '../components/Button'

export default function FarmerOnboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    idCard: null,
    cropPhotos: [],
    farmLocation: '',
    farmAddress: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleIDUpload = (e) => {
    setFormData({ ...formData, idCard: e.target.files[0] })
  }

  const handleCropPhotoUpload = (e) => {
    const files = Array.from(e.target.files)
    setFormData({ ...formData, cropPhotos: [...formData.cropPhotos, ...files] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setUploading(true)

    try {
      const verificationDocs = {
        idCardUrl: null,
        cropPhotoUrls: [],
        farmLocation: formData.farmLocation,
        farmAddress: formData.farmAddress,
        verified: true, // Auto-verify for hackathon
        verifiedAt: new Date().toISOString()
      }

      if (formData.idCard) {
        verificationDocs.idCardUrl = await uploadID(formData.idCard, user.uid)
      }

      for (const photo of formData.cropPhotos) {
        const url = await uploadCropPhoto(photo, user.uid)
        verificationDocs.cropPhotoUrls.push(url)
      }

      await updateDoc(doc(db, 'users', user.uid), {
        ...verificationDocs,
        onboardingComplete: true
      })

      navigate('/')
    } catch (err) {
      alert('Error uploading: ' + err.message)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Farmer Verification</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Card <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleIDUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            {formData.idCard && (
              <p className="text-sm text-gray-600 mt-1">Selected: {formData.idCard.name}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crop Photos <span className="text-red-500">*</span> (at least 2)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleCropPhotoUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {formData.cropPhotos.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Selected {formData.cropPhotos.length} photo(s):</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {formData.cropPhotos.map((photo, idx) => (
                    <li key={idx}>{photo.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Input
            label="Farm Location (Coordinates or Address)"
            value={formData.farmLocation}
            onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
            placeholder="e.g., 28.6139° N, 77.2090° E or Farm address"
            required
          />

          <Input
            label="Full Farm Address"
            value={formData.farmAddress}
            onChange={(e) => setFormData({ ...formData, farmAddress: e.target.value })}
            placeholder="Complete address of your farm"
            required
          />

          <Button type="submit" disabled={loading || uploading} className="w-full">
            {uploading ? 'Uploading...' : loading ? 'Submitting...' : 'Complete Verification'}
          </Button>
        </form>
      </div>
    </div>
  )
}

