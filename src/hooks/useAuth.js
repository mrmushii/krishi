import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'
import { getCurrentUserData } from '../services/authService'

export const useAuth = () => {
  const [state, setState] = useState({
    user: null,
    userData: null,
    loading: true,
  })

  useEffect(() => {
    let active = true

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return

      if (!currentUser) {
        setState({ user: null, userData: null, loading: false })
        return
      }

      setState((prev) => ({ ...prev, user: currentUser, loading: true }))

      try {
        const data = await getCurrentUserData(currentUser.uid)
        if (active) {
          setState({ user: currentUser, userData: data, loading: false })
        }
      } catch {
        if (active) {
          setState({ user: currentUser, userData: null, loading: false })
        }
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return state
}
