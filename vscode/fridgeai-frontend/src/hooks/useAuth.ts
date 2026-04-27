import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { getMe } from '../api/auth'
import axios from 'axios'

const MAX_RETRIES = 6
const RETRY_DELAY_MS = 5_000

export function useAuth() {
  const { user, setUser, initialized, setInitialized } = useAuthStore()

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
          // 401 = 로그인 안 된 것 → 재시도 불필요
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            if (!cancelled) setUser(null)
            return
          }
          // 네트워크 오류 = 서버 콜드스타트 → 재시도
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

  return { user, setUser, initialized }
}
