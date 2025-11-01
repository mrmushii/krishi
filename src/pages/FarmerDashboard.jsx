import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { db } from '../config/firebase'
import Button from '../components/Button'
import Input from '../components/Input'
import Navbar from '../components/Navbar'

export default function FarmerDashboard() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: '',
    marketPrice: '',
    unit: 'kg'
  })

  useEffect(() => {
    if (userData?.role === 'farmer' && !userData?.verified && !userData?.onboardingComplete) {
      navigate('/onboarding')
    }
    loadProducts()
  }, [user, userData])

  const loadProducts = async () => {
    if (!user) return
    const q = query(collection(db, 'products'), where('farmerId', '==', user.uid))
    const snapshot = await getDocs(q)
    setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        farmerId: user.uid,
        farmerName: userData?.name || user.email,
        listedAt: new Date().toISOString(),
        status: 'available',
        quantity: parseFloat(newProduct.quantity),
        marketPrice: parseFloat(newProduct.marketPrice),
        createdAt: Timestamp.now()
      })
      setNewProduct({ name: '', quantity: '', marketPrice: '', unit: 'kg' })
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
            <Button onClick={() => setShowAddProduct(!showAddProduct)}>
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
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
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
                onChange={(e) => setNewProduct({ ...newProduct, marketPrice: e.target.value })}
                required
              />

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
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    product.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
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

