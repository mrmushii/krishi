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
      // Get all products
      const productsSnap = await getDocs(collection(db, 'products'))
      const availableProducts = productsSnap.docs.filter(doc => doc.data().status === 'available').length
      
      // Get all users
      const usersSnap = await getDocs(collection(db, 'users'))
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      const verifiedFarmers = users.filter(u => u.role === 'farmer' && u.verified).length
      const agents = users.filter(u => u.role === 'agent').length
      const verifiedBuyers = users.filter(u => u.role === 'buyer' && u.verified).length
      
      setStats({
        totalProducts: availableProducts,
        connectedFarmers: verifiedFarmers,
        workingAgents: agents,
        buyersServed: verifiedBuyers
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const handleProductClick = (productId) => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left"
            aria-label="FarmLink home"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2 2.5 7v10.5A1.5 1.5 0 0 0 4 19h3.5v-6h5v6H16c.828 0 1.5-.672 1.5-1.5V7L10 2Z" />
              </svg>
            </div>
            <span className="font-semibold text-lg sm:text-2xl text-emerald-600">FarmLink</span>
          </button>

          <div className="hidden items-center gap-10 text-sm font-medium text-slate-600 md:flex">
            <a href="#about" className="hover:text-emerald-600">About</a>
            <a href="#features" className="hover:text-emerald-600">Features</a>
            <a href="#products" className="hover:text-emerald-600">Marketplace</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition"
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
      </nav>

      <main className="flex-1">
        <section id="hero" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700" />
          <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -right-32 -bottom-20 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
            <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.4em] text-emerald-100">
                  Fair • Fresh • Transparent
                </span>
                <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[3.35rem]">
                  Powering direct farm-to-market relationships that raise every harvest.
                </h1>
                <p className="mt-6 text-lg text-emerald-50 sm:text-xl">
                  Farmers list produce with real-time freshness pricing while buyers secure reliable supply chains in minutes—
                  no middlemen, just clarity and trust.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
                  <Button
                    onClick={() => navigate('/signup')}
                    className="min-w-[160px] bg-white text-emerald-700 font-semibold  hover:bg-emerald-100 hover:text-emerald-800"
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
                <dl className="mt-12 grid gap-6 text-left text-sm text-emerald-100 sm:grid-cols-3">
                  {[
                    { label: 'Connected Farmers', value: stats.connectedFarmers },
                    { label: 'Verified Buyers', value: stats.buyersServed },
                    { label: 'Products Available', value: stats.totalProducts }
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
                      <dt className="text-xs uppercase tracking-[0.25em]"> {item.label} </dt>
                      <dd className="mt-1 text-2xl font-semibold text-white">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="relative mx-auto w-full max-w-md">
                <div className="rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-2xl shadow-emerald-900/40 backdrop-blur-sm">
                  <div className="rounded-3xl bg-white p-6 text-left text-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">
                      Why FarmLink
                    </p>
                    <h2 className="mt-4 text-2xl font-bold text-slate-900">All-in-one commerce for agriculture</h2>
                    <ul className="mt-6 space-y-4 text-sm text-slate-600">
                      {[
                        'Real-time freshness adjustments ensure fair pricing.',
                        'Smart logistics booking keeps cold chain intact.',
                        'End-to-end verification builds trust with every transaction.'
                      ].map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      “FarmLink helped me close consistent deals and upgrade our storage facilities within three months.”
                      <div className="mt-2 text-xs text-emerald-500">— Amina Rahman, Tomato Farmer</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-emerald-200/40 blur-2xl" />
                <div className="absolute -bottom-8 right-0 h-24 w-24 rounded-full bg-white/40 blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">Who We Are</span>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Rooted in farmer-first commerce</h2>
              <p className="mt-5 text-lg text-slate-600">
                FarmLink bridges growers, agents, and institutional buyers with transparent data, verified profiles, and
                logistics coordination. We reduce waste and increase margins by keeping every voice at the table.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: 'Mission-led',
                  copy: 'Fair pricing models uplift farming communities with predictable income and long-term planning.'
                },
                {
                  title: 'Sustainable Vision',
                  copy: 'Streamlined procurement workflows cut waste, reduce emissions, and keep produce fresher for longer.'
                },
                {
                  title: 'Trust First',
                  copy: 'Multi-layer verification and traceability build confidence for buyers and unlock new export routes.'
                }
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-100/60"
                >
                  <h3 className="text-xl font-semibold text-emerald-600">{item.title}</h3>
                  <p className="mt-4 text-slate-600 leading-relaxed">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-6 text-center">
              <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">
                Platform Highlights
              </span>
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Built for modern agriculture</h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                We combine verified supply, dynamic market intelligence, and collaborative tools so every stakeholder
                operates with speed and clarity.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: '🌾', title: 'Direct Farm Deals', copy: 'Negotiate transparently with verified farmers nationwide.' },
                { icon: '❄️', title: 'Smart Cold Storage', copy: 'Reserve monitored storage hubs to extend shelf life.' },
                { icon: '🚚', title: 'Optimized Logistics', copy: 'Match with vetted transport partners for every route.' },
                { icon: '💬', title: '24/7 Support', copy: 'Access multilingual support, agronomy tips, and financing advice.' }
              ].map((feature) => (
                <article
                  key={feature.title}
                  className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-4xl">{feature.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm text-slate-600">{feature.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="products" className="bg-slate-900 py-20 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
                Fresh Today
              </span>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Featured marketplace lots</h2>
              <p className="mt-4 max-w-2xl text-base text-emerald-100">
                Discover spotlight harvests with adaptive freshness pricing so you always lock in the fairest value for every unit.
              </p>
            </div>

            {products.length === 0 ? (
              <p className="mt-14 text-center text-emerald-100/70">No products available yet</p>
            ) : (
              <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                  const priceInfo = calculateFreshPrice(product.marketPrice, product.listedAt)
                  return (
                    <article
                      key={product.id}
                      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      {product.cropImages?.length > 0 ? (
                        <div className="relative h-48 w-full overflow-hidden">
                          <img
                            src={product.cropImages[0]}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                        </div>
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-emerald-200">
                          <span className="text-xs uppercase tracking-[0.35em]">Awaiting imagery</span>
                        </div>
                      )}
                      <div className="flex flex-1 flex-col gap-4 p-6">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{product.name}</h3>
                          <p className="mt-1 text-sm text-emerald-200">By {product.farmerName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">Freshness adjusted</p>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-emerald-300">{formatPrice(priceInfo.price)}</span>
                            <span className="text-sm text-emerald-200">/ {product.unit}</span>
                          </div>
                          <p className="mt-2 text-xs text-emerald-200/80">
                            {priceInfo.label ?? 'Dynamic pricing keeps produce competitive and fair.'}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleProductClick(product.id)}
                          className="mt-auto w-full bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-semibold"
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

        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-6 text-center">
              <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">
                Impact
              </span>
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Growing network, real outcomes</h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Every deal on FarmLink strengthens local economies, improves food security, and keeps supply chains resilient.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Products', value: stats.totalProducts },
                { label: 'Connected Farmers', value: stats.connectedFarmers },
                { label: 'Working Agents', value: stats.workingAgents },
                { label: 'Buyers Served', value: stats.buyersServed }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm"
                >
                  <div className="text-4xl font-bold text-emerald-600">{item.value}</div>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700" />
          <div className="relative mx-auto max-w-5xl px-4 text-center text-white sm:px-6 lg:px-10">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to modernize your agricultural trade?</h2>
            <p className="mt-4 text-lg text-emerald-100">
              Join a trusted network where produce meets demand seamlessly, logistics stay transparent, and every harvest finds its market.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => navigate('/signup')}
                className="min-w-[180px] bg-white text-emerald-700 hover:bg-emerald-100 font-semibold"
              >
                Create free account
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="min-w-[180px] border-white text-white hover:bg-white hover:text-emerald-700 font-semibold"
              >
                Talk to our team
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-10">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <h3 className="text-xl font-semibold text-white">FarmLink</h3>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                Enabling fair sourcing, fresher produce, and smarter logistics for the agricultural community with tools that
                put farmers and buyers on the same page.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Quick Links</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#products" className="hover:text-white">Marketplace</a></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white">Sign In</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Contact</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>Email: support@farmlink.com</li>
                <li>Phone: +880 XXXX XXXX</li>
                <li>
                  <div className="mt-4 flex gap-4 text-sm">
                    <a href="#" className="hover:text-white">Facebook</a>
                    <a href="#" className="hover:text-white">Twitter</a>
                    <a href="#" className="hover:text-white">LinkedIn</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
            &copy; 2024 FarmLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
