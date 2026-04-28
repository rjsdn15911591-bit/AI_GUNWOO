import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { getMe } from '../api/auth'
import axios from 'axios'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 3_000

export function useAuth() {
  const { setUser, initialized, setInitialized } = useAuthStore()

  useEffect(() => {
    if (initialized) return
    let cancelled = false

    async function tryGetMe() {
      for (let i = 0; i <= MAX_RETRIES; i++) {
        try {
          const data = await getMe()
          if (!cancelled) setUser(data)
          return
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            if (!cancelled) setUser(null)
            return
          }
          if (i === MAX_RETRIES || cancelled) {
            if (!cancelled) setUser(null)
            return
          }
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
        }
      }
    }

    tryGetMe().finally(() => {
      if (!cancelled) setInitialized(true)
    })

    return () => { cancelled = true }
  }, [])

  return useAuthStore()
}
