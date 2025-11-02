import { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { calculateFreshPrice, formatPrice } from '../utils/priceFreshness'
import Button from '../components/Button'
import Input from '../components/Input'
import Navbar from '../components/Navbar'

export default function Marketplace() {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    maxPrice: '',
    productName: ''
  })

  const loadProducts = useCallback(async () => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.status === 'available')
      .filter(p => {
        if (!filters.search) return true
        const search = filters.search.toLowerCase()
        return (
          p.name.toLowerCase().includes(search) ||
          p.farmerName?.toLowerCase().includes(search)
        )
      })
      .filter(p => {
        if (!filters.maxPrice) return true
        const priceInfo = calculateFreshPrice(p.marketPrice, p.listedAt)
        return priceInfo.price <= Number(filters.maxPrice)
      })
      .filter(p => {
        if (!filters.productName) return true
        return p.name.toLowerCase().includes(filters.productName.toLowerCase())
      })
  }, [products, filters])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search products or farmers..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
            <Input
              placeholder="Product name"
              value={filters.productName}
              onChange={(e) => handleFilterChange('productName', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No products found
            </div>
          ) : (
            filteredProducts.map(product => {
              const priceInfo = calculateFreshPrice(product.marketPrice, product.listedAt)
              const availableQty = product.availableQuantity !== undefined ? product.availableQuantity : product.quantity
              const aiRating = product.aiAnalysis?.rating
              const isRecommended = product.aiAnalysis?.is_recommended
              
              return (
                <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  {product.cropImages && product.cropImages.length > 0 && (
                    <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                      <img
                        src={product.cropImages[0]}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onClick={() => navigate(`/product/${product.id}`)}
                      />
                      {aiRating && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                          <span>⭐</span>
                          <span>{aiRating}/10</span>
                        </div>
                      )}
                      {isRecommended && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          ✅ AI Verified
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{product.name}</h3>
                      {priceInfo.isFresh ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Fresh</span>
                      ) : (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                          {priceInfo.discount.toFixed(0)}% off
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-2">By: {product.farmerName}</p>
                    <p className={`text-sm mb-2 ${availableQty <= 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                      Available: {availableQty} {product.unit}
                      {availableQty <= 0 && <span className="ml-2">(Out of Stock)</span>}
                    </p>
                    
                    {product.aiAnalysis && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">
                          AI Quality: {product.aiAnalysis.condition} 
                          {product.aiAnalysis.rating && ` (${product.aiAnalysis.rating}/10)`}
                        </p>
                      </div>
                    )}

                    <div className="mb-2">
                      {priceInfo.isFresh ? (
                        <p className="text-2xl font-bold text-green-600">
                          {formatPrice(priceInfo.price)}/{product.unit}
                        </p>
                      ) : (
                        <div>
                          <p className="text-lg text-gray-400 line-through">
                            {formatPrice(product.marketPrice)}
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatPrice(priceInfo.price)}/{product.unit}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Listed {priceInfo.daysOld === 0 ? 'today' : `${priceInfo.daysOld} day(s) ago`}
                      </p>
                    </div>

                    <Button
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="w-full mt-4"
                      disabled={availableQty <= 0}
                    >
                      {availableQty <= 0 ? 'Out of Stock' : 'View Details'}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
