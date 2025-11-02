import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../services/authService'
import Button from './Button'
import NotificationBell from './NotificationBell'

const baseLinks = [
  { path: '/marketplace', label: 'Marketplace' },
  { path: '/community', label: 'Community' },
  { path: '/orders', label: 'Orders' }
]

const roleLinks = {
  buyer: [
    { path: '/cart', label: 'Cart' },
    { path: '/wishlist', label: 'Wishlist' },
    { path: '/ledger', label: 'Ledger' }
  ],
  agent: [
    { path: '/', label: 'Dashboard', exact: true },
    { path: '/agent/verification', label: 'Verifications' }
  ]
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userData } = useAuth()

  const links = useMemo(() => {
    if (!userData?.role) return baseLinks
    return [...baseLinks, ...(roleLinks[userData.role] ?? [])]
  }, [userData?.role])

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  const navButtonClass = (path, exact) =>
    `px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
      isActive(path, exact)
        ? 'bg-emerald-500 text-white'
        : 'text-slate-700 hover:bg-emerald-50 hover:text-slate-900'
    }`

  return (
    <nav className="bg-white shadow border-b border-emerald-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div onClick={() => navigate('/')} className="flex items-center cursor-pointer">
              <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11c0 .552.448 1 1 1h3v-6h6v6h3c.552 0 1-.448 1-1V7l-7-5z" />
              </svg>
              <span className="ml-2 text-xl font-bold text-slate-900">FarmLink</span>
            </div>

            <div className="hidden md:flex space-x-1">
              {links.map(({ path, label, exact }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={navButtonClass(path, exact)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="hidden sm:block text-slate-700">
              {userData?.name || 'User'}
              {userData?.verified && (
                <span className="ml-2 px-2 py-1 bg-emerald-500 text-white text-xs rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>
            <Button variant="secondary" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-emerald-200 bg-white">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {baseLinks.map(({ path, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                isActive(path)
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-700 hover:bg-emerald-50 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
