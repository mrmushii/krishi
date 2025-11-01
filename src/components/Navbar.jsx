import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../services/authService'
import Button from './Button'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userData } = useAuth()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-farmlink-dark shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div 
              onClick={() => navigate('/')} 
              className="flex items-center cursor-pointer"
            >
              <svg className="w-8 h-8 text-farmlink-orange" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11c0 .552.448 1 1 1h3v-6h6v6h3c.552 0 1-.448 1-1V7l-7-5z"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-white">FarmLink</span>
            </div>

            <div className="hidden md:flex space-x-1">
              <button
                onClick={() => navigate('/marketplace')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/marketplace') 
                    ? 'bg-farmlink-orange text-white' 
                    : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
                }`}
              >
                Marketplace
              </button>
              
              <button
                onClick={() => navigate('/community')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/community') 
                    ? 'bg-farmlink-orange text-white' 
                    : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
                }`}
              >
                Community
              </button>

              <button
                onClick={() => navigate('/orders')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/orders') 
                    ? 'bg-farmlink-orange text-white' 
                    : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
                }`}
              >
                Orders
              </button>

              {userData?.role === 'buyer' && (
                <>
                  <button
                    onClick={() => navigate('/cart')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive('/cart') 
                        ? 'bg-farmlink-orange text-white' 
                        : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
                    }`}
                  >
                    Cart
                  </button>
                  <button
                    onClick={() => navigate('/wishlist')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive('/wishlist') 
                        ? 'bg-farmlink-orange text-white' 
                        : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
                    }`}
                  >
                    Wishlist
                  </button>
                  <button
                    onClick={() => navigate('/ledger')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive('/ledger') 
                        ? 'bg-farmlink-orange text-white' 
                        : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
                    }`}
                  >
                    Ledger
                  </button>
                </>
              )}

              {userData?.role === 'agent' && (
                <>
                  <button
                    onClick={() => navigate('/')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive('/') && location.pathname === '/' 
                        ? 'bg-farmlink-orange text-white' 
                        : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/agent/verification')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive('/agent/verification') 
                        ? 'bg-farmlink-orange text-white' 
                        : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
                    }`}
                  >
                    Verifications
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-gray-300">
              {userData?.name || 'User'}
              {userData?.verified && (
                <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
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

      {/* Mobile menu */}
      <div className="md:hidden border-t border-farmlink-light">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <button
            onClick={() => navigate('/marketplace')}
            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
              isActive('/marketplace') 
                ? 'bg-farmlink-orange text-white' 
                : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => navigate('/community')}
            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
              isActive('/community') 
                ? 'bg-farmlink-orange text-white' 
                : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
            }`}
          >
            Community
          </button>
          <button
            onClick={() => navigate('/orders')}
            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
              isActive('/orders') 
                ? 'bg-farmlink-orange text-white' 
                : 'text-gray-300 hover:bg-farmlink-light hover:text-white'
            }`}
          >
            Orders
          </button>
        </div>
      </div>
    </nav>
  )
}

