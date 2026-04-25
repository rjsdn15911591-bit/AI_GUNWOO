import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { getMe } from '../api/auth'

export function useAuth() {
  const { user, setUser } = useAuthStore()

  useEffect(() => {
    if (!user) {
      getMe()
        .then(setUser)
        .catch(() => setUser(null))
    }
  }, [])

  return { user, setUser }
}
