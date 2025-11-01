import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../services/authService'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'buyer'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp(formData.email, formData.password, formData.role, {
        name: formData.name
      })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-green-600 mb-8">Krishi</h1>
        <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer</option>
              <option value="agent">Agent</option>
            </select>
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <Button type="submit" disabled={loading} className="w-full mb-4">
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
        
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-green-600 hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

