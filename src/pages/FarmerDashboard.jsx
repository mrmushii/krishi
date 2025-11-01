import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { db } from '../config/firebase'
import { uploadToCloudinary } from '../services/storageService'
import Button from '../components/Button'
import Input from '../components/Input'
import Navbar from '../components/Navbar'

const INITIAL_PRODUCT = {
  name: '',
  quantity: '',
  marketPrice: '',
  unit: 'kg',
  cropImages: []
}

export default function FarmerDashboard() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState(INITIAL_PRODUCT)
  const [cropPreviews, setCropPreviews] = useState([])

  const loadProducts = useCallback(async () => {
    if (!user) return
    const q = query(collection(db, 'products'), where('farmerId', '==', user.uid))
    const snapshot = await getDocs(q)
    setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }, [user])

  useEffect(() => {
    if (userData?.role === 'farmer') {
      if (!userData?.registrationPaid) {
        navigate('/farmer-payment')
        return
      }
      if (!userData?.verified && !userData?.onboardingComplete) {
        navigate('/onboarding')
        return
      }
    }
    loadProducts()
  }, [userData, navigate, loadProducts])

  useEffect(() => {
    const urls = newProduct.cropImages.map(file => URL.createObjectURL(file))
    setCropPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [newProduct.cropImages])

  const handleCropImageUpload = (e) => {
    const files = e?.target?.files ? Array.from(e.target.files) : []
    setNewProduct(prev => ({ ...prev, cropImages: files }))
  }

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target
    setNewProduct(prev => ({ ...prev, [field]: value }))
  }

  const handleRemoveImage = (idx) => {
    setNewProduct(prev => ({
      ...prev,
      cropImages: prev.cropImages.filter((_, i) => i !== idx)
    }))
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      const cropImageUrls = await Promise.all(
        newProduct.cropImages.map(image => uploadToCloudinary(image, `products/${user.uid}`))
      )

      await addDoc(collection(db, 'products'), {
        name: newProduct.name.trim(),
        quantity: parseFloat(newProduct.quantity) || 0,
        marketPrice: parseFloat(newProduct.marketPrice) || 0,
        unit: newProduct.unit,
        cropImages: cropImageUrls,
        farmerId: user.uid,
        farmerName: userData?.name || user.email,
        listedAt: new Date().toISOString(),
        status: 'available',
        createdAt: Timestamp.now()
      })

      setNewProduct(INITIAL_PRODUCT)
      setShowAddProduct(false)
      loadProducts()
    } catch (err) {
      alert('Error adding product: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {userData?.name || user?.email}</h2>
          {userData?.verified && (
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              ✓ Verified Farmer
            </span>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">My Products</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/orders')}>
              My Orders
            </Button>
            <Button onClick={() => setShowAddProduct(prev => !prev)}>
              {showAddProduct ? 'Cancel' : '+ Add Product'}
            </Button>
          </div>
        </div>

        {showAddProduct && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
            <form onSubmit={handleAddProduct}>
              <Input
                label="Product Name"
                value={newProduct.name}
                onChange={handleFieldChange('name')}
                required
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={newProduct.quantity}
                  onChange={handleFieldChange('quantity')}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={newProduct.unit}
                    onChange={handleFieldChange('unit')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">Quintal</option>
                    <option value="ton">Ton</option>
                  </select>
                </div>
              </div>

              <Input
                label="Market Price (৳ per unit)"
                type="number"
                value={newProduct.marketPrice}
                onChange={handleFieldChange('marketPrice')}
                required
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Quality Images (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCropImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {cropPreviews.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Selected {cropPreviews.length} image(s):</p>
                    <div className="grid grid-cols-3 gap-2">
                      {cropPreviews.map((src, idx) => (
                        <div key={src} className="relative">
                          <img
                            src={src}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">Add Product</Button>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No products listed yet. Add your first product!
            </div>
          ) : (
            products.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <p className="text-gray-600">Quantity: {product.quantity} {product.unit}</p>
                    <p className="text-gray-600">Market Price: ৳{product.marketPrice} per {product.unit}</p>
                    <p className="text-sm text-gray-500">
                      Listed: {new Date(product.listedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      product.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
