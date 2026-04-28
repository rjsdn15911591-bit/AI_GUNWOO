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
        } catch (err: unknown) {
          const hasResponse = !!(err as { response?: unknown })?.response
          if (hasResponse || i === MAX_RETRIES || cancelled) {
            // 서버가 응답한 경우(401 등) 또는 재시도 초과 → 즉시 종료
            if (!cancelled) setUser(null)
            return
          }
          // 네트워크 오류(서버 콜드스타트) → 재시도
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
