import { useState, useEffect } from 'react'

const HEALTH_URL = (import.meta.env.VITE_API_BASE_URL || '') + '/health'
const MAX_WAIT_MS = 40_000
const INTERVAL_MS = 2_000

export function useServerReady() {
  const [ready, setReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    const startedAt = Date.now()

    async function ping() {
      while (!cancelled) {
        try {
          const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(5000) })
          if (res.ok) {
            if (!cancelled) setReady(true)
            return
          }
        } catch {
          // 백엔드 아직 준비 안 됨 — 재시도
        }

        if (Date.now() - startedAt >= MAX_WAIT_MS) {
          if (!cancelled) setTimedOut(true)
          return
        }

        await new Promise((r) => setTimeout(r, INTERVAL_MS))
      }
    }

    ping()
    return () => { cancelled = true }
  }, [])

  return { ready, timedOut }
}
