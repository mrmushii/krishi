import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-gray-900">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg className="w-9 h-9 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11c0 .552.448 1 1 1h3v-6h6v6h3c.552 0 1-.448 1-1V7l-7-5z" />
              </svg>
              <span className="ml-2 text-2xl font-bold text-emerald-600">FarmLink</span>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Sign In
              </button>
              <Button
                onClick={() => navigate('/signup')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section id="hero" className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-20">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="uppercase tracking-[0.4em] text-emerald-100 text-xs sm:text-sm mb-6">
              fair • transparent • sustainable
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Connecting Farmers Directly With Buyers
            </h1>
            <p className="text-lg sm:text-xl text-emerald-50 max-w-2xl mx-auto mb-10 leading-relaxed">
              Unlock better prices, fresher produce, and trusted partnerships across the agricultural value chain.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => navigate('/signup')}
                className="min-w-[160px] bg-white text-emerald-700 font-semibold hover:bg-emerald-100 hover:text-emerald-800"
              >
                Join as Farmer
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                variant="outline"
                className="min-w-[160px] border-white text-white hover:bg-white hover:text-emerald-700 font-semibold"
              >
                Join as Buyer
              </Button>
            </div>
          </div>
        </section>

        <section id="about" className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-sm uppercase tracking-[0.3em] text-emerald-500">Who We Are</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-emerald-700">About FarmLink</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Our marketplace eliminates unnecessary middlemen, allowing farmers to showcase quality produce while
                buyers gain transparent pricing and reliable supply. Together, we foster sustainable agriculture.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Mission-Led',
                  copy: 'Empower farmers through direct market access and fair trade, ensuring dignified livelihoods.'
                },
                {
                  title: 'Sustainable Vision',
                  copy: 'Build a resilient, traceable supply chain where every stakeholder benefits from clarity.'
                },
                {
                  title: 'Trust First',
                  copy: 'Guarantee quality and transparency so buyers source confidently and communities thrive.'
                }
              ].map((item) => (
                <article
                  key={item.title}
                  className="bg-white rounded-2xl shadow-md shadow-emerald-100/70 p-6 border border-emerald-100"
                >
                  <h3 className="text-xl font-semibold text-emerald-600 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-16 bg-emerald-50/70">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-emerald-700 mb-12">
              Built for Modern Agriculture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🌾', title: 'Direct Farm Deals', copy: 'Negotiate transparently with verified farmers nationwide.' },
                { icon: '❄️', title: 'Smart Cold Storage', copy: 'Reserve temperature-controlled hubs for extended freshness.' },
                { icon: '🚚', title: 'Optimized Logistics', copy: 'Leverage trusted transport partners for last-mile delivery.' },
                { icon: '💬', title: '24/7 Support', copy: 'Access multilingual help, agronomy tips, and financing advice.' }
              ].map((feature) => (
                <article
                  key={feature.title}
                  className="bg-white rounded-2xl border border-emerald-100 p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-emerald-600 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="products" className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col items-center text-center mb-12">
              <span className="text-sm uppercase tracking-[0.3em] text-emerald-500">Fresh Today</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-emerald-700">Featured Products</h2>
              <p className="mt-4 text-gray-600 max-w-2xl">
                Browse spotlight harvests adjusted for freshness so you always get the fairest market value.
              </p>
            </div>
            {products.length === 0 ? (
              <p className="text-center text-gray-500">No products available yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => {
                  const priceInfo = calculateFreshPrice(product.marketPrice, product.listedAt)
                  return (
                    <article
                      key={product.id}
                      className="group bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                    >
                      {product.cropImages?.length > 0 && (
                        <div className="relative">
                          <img
                            src={product.cropImages[0]}
                            alt={product.name}
                            className="w-full h-52 object-cover group-hover:scale-[1.02] transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="text-xl font-semibold text-emerald-700 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">By {product.farmerName}</p>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-2xl font-bold text-emerald-600">{formatPrice(priceInfo.price)}</span>
                          <span className="text-sm text-gray-500">/ {product.unit}</span>
                        </div>
                        <Button
                          onClick={() => handleProductClick(product.id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                        >
                          View Details
                        </Button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Our Growing Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Products', value: stats.totalProducts },
                { label: 'Connected Farmers', value: stats.connectedFarmers },
                { label: 'Working Agents', value: stats.workingAgents },
                { label: 'Buyers Served', value: stats.buyersServed }
              ].map((item) => (
                <div key={item.label} className="bg-white/10 rounded-2xl px-6 py-8 text-center">
                  <div className="text-4xl font-bold text-white">{item.value}</div>
                  <div className="mt-2 text-sm uppercase tracking-[0.3em] text-emerald-100">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">FarmLink</h3>
              <p className="leading-relaxed">
                Enabling fair sourcing, fresher produce, and smarter logistics for the agricultural community.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#products" className="hover:text-white">Products</a></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white">Sign In</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>Email: support@farmlink.com</li>
                <li>Phone: +880 XXXX XXXX</li>
                <li>
                  <div className="flex gap-4 mt-4 text-sm">
                    <a href="#" className="hover:text-white">Facebook</a>
                    <a href="#" className="hover:text-white">Twitter</a>
                    <a href="#" className="hover:text-white">LinkedIn</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
            &copy; 2024 FarmLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
