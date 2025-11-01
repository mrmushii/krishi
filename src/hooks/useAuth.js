import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'
import { getCurrentUserData } from '../services/authService'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const data = await getCurrentUserData(currentUser.uid)
        setUserData(data)
      } else {
        setUserData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, userData, loading }
}

