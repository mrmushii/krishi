import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../services/authService'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = useCallback(({ target: { name, value } }) => {
    setCredentials((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setError('')
      setLoading(true)
      try {
        await signIn(credentials.email, credentials.password)
        navigate('/')
      } catch (err) {
        setError(err.message || 'Failed to sign in')
      } finally {
        setLoading(false)
      }
    },
    [credentials, navigate]
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-green-600 mb-8">Krishi</h1>
        <h2 className="text-2xl font-semibold text-center mb-6">Sign In</h2>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={credentials.email}
            onChange={handleChange}
            required
            error={error}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleChange}
            required
          />

          <Button
            type="submit"
            disabled={loading || !credentials.email || !credentials.password}
            className="w-full mb-4"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-green-600 hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}
