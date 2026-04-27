import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { getMe } from '../api/auth'

export function useAuth() {
  const { user, setUser, initialized, setInitialized } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      getMe()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setInitialized(true))
    }
  }, [])

  return { user, setUser, initialized }
}
