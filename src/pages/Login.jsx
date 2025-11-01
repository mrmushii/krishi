import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../services/authService'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-green-600 mb-8">Krishi</h1>
        <h2 className="text-2xl font-semibold text-center mb-6">Sign In</h2>
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={error}
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button type="submit" disabled={loading} className="w-full mb-4">
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

