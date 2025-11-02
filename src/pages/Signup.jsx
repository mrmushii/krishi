import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../services/authService'
import Input from '../components/Input'
import Button from '../components/Button'

const INITIAL_FORM = Object.freeze({
  email: '',
  password: '',
  name: '',
  role: 'buyer'
})

export default function Signup() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = useCallback(({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const roleOptions = useMemo(
    () => [
      { value: 'buyer', label: 'Buyer' },
      { value: 'farmer', label: 'Farmer' },
      { value: 'agent', label: 'Agent' },
      { value: 'driver', label: 'Driver' },
      { value: 'admin', label: 'Admin' }
    ],
    []
  )

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp(formData.email, formData.password, formData.role, { name: formData.name })
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
        <h1 className="text-3xl font-bold text-center text-deshbazar-primary mb-8">FarmLink</h1>
        <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>

        <form onSubmit={handleSubmit}>
          <Input label="Name" name="name" value={formData.name} onChange={handleChange} required />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deshbazar-primary bg-white"
              required
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full mb-4">
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-deshbazar-primary hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
