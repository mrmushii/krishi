import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import Button from '../components/Button'
import { calculateFreshPrice, formatPrice } from '../utils/priceFreshness'

export default function Landing() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    connectedFarmers: 0,
    workingAgents: 0,
    buyersServed: 0
  })

  useEffect(() => {
    loadProducts()
    loadStats()
  }, [])

  const loadProducts = async () => {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(8))
      const snapshot = await getDocs(q)
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (err) {
      console.error('Error loading products:', err)
    }
  }

  const loadStats = async () => {
    try {
      const [productsSnap, farmersSnap, agentsSnap, buyersSnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), where('status', '==', 'available'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'farmer'), where('verified', '==', true))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'agent'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'buyer'), where('verified', '==', true)))
      ])
      
      setStats({
        totalProducts: productsSnap.size,
        connectedFarmers: farmersSnap.size,
        workingAgents: agentsSnap.size,
        buyersServed: buyersSnap.size
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const handleProductClick = (productId) => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-farmlink-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-farmlink-orange" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11c0 .552.448 1 1 1h3v-6h6v6h3c.552 0 1-.448 1-1V7l-7-5z"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-white">FarmLink</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-300 hover:text-white px-4 py-2"
              >
                Sign In
              </button>
              <Button onClick={() => navigate('/signup')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Connect Farmers Directly with Buyers</h1>
          <p className="text-xl mb-8 text-green-100">
            Fair trade, transparent pricing, and quality assurance for everyone
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/signup')} className="bg-white text-green-600 hover:bg-gray-100">
              Join as Farmer
            </Button>
            <Button onClick={() => navigate('/signup')} variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
              Join as Buyer
            </Button>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">About FarmLink</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our mission is to connect farmers directly with buyers, eliminating middlemen and ensuring fair prices. 
              We promote transparent trade, quality assurance, and sustainable agriculture practices.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
              <p className="text-gray-600">Empower farmers by connecting them directly with buyers, ensuring fair trade and better livelihoods.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
              <p className="text-gray-600">Create a sustainable agricultural marketplace where quality meets transparency.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Fair Trade</h3>
              <p className="text-gray-600">We believe in fair pricing, quality products, and building trust between farmers and buyers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🌾</div>
              <h3 className="text-xl font-semibold mb-2">Direct Connection</h3>
              <p className="text-gray-600">Connect farmers with buyers without intermediaries</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">❄️</div>
              <h3 className="text-xl font-semibold mb-2">Cold Storage</h3>
              <p className="text-gray-600">Rent cold storage facilities for your produce</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2">Easy Transportation</h3>
              <p className="text-gray-600">Streamlined logistics and delivery options</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support and community Q&A</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Featured Products</h2>
          {products.length === 0 ? (
            <p className="text-center text-gray-500">No products available yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => {
                const priceInfo = calculateFreshPrice(product.marketPrice, product.listedAt)
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {product.cropImages && product.cropImages.length > 0 && (
                      <img 
                        src={product.cropImages[0]} 
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">By: {product.farmerName}</p>
                      <p className="text-2xl font-bold text-farmlink-orange mb-4">
                        {formatPrice(priceInfo.price)}/{product.unit}
                      </p>
                      <Button 
                        onClick={() => handleProductClick(product.id)}
                        className="w-full"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Analytics */}
      <section className="py-16 bg-farmlink-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-farmlink-orange mb-2">{stats.totalProducts}</div>
              <div className="text-xl">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-farmlink-orange mb-2">{stats.connectedFarmers}</div>
              <div className="text-xl">Connected Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-farmlink-orange mb-2">{stats.workingAgents}</div>
              <div className="text-xl">Working Agents</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-farmlink-orange mb-2">{stats.buyersServed}</div>
              <div className="text-xl">Buyers Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">FarmLink</h3>
              <p className="text-gray-400">
                Connecting farmers directly with buyers for fair trade and quality produce.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#products" className="hover:text-white">Products</a></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white">Sign In</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: support@farmlink.com</li>
                <li>Phone: +880 XXXX XXXX</li>
                <li>
                  <div className="flex gap-4 mt-4">
                    <a href="#" className="hover:text-white">Facebook</a>
                    <a href="#" className="hover:text-white">Twitter</a>
                    <a href="#" className="hover:text-white">LinkedIn</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FarmLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

