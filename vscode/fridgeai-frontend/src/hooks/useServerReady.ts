import { useState, useEffect } from 'react'

const HEALTH_URL = (import.meta.env.VITE_API_BASE_URL || '') + '/health'
const MAX_WAIT_MS = 40_000
const PING_TIMEOUT_MS = 4_000
const RETRY_DELAY_MS = 2_000

export function useServerReady() {
  const [ready, setReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    const startedAt = Date.now()

    async function ping(): Promise<boolean> {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)
      try {
        const res = await fetch(HEALTH_URL, { signal: controller.signal })
        return res.ok
      } catch {
        return false
      } finally {
        clearTimeout(timer)
      }
    }

    async function loop() {
      while (!cancelled) {
        const ok = await ping()
        if (cancelled) return
        if (ok) {
          setReady(true)
          return
        }
        if (Date.now() - startedAt >= MAX_WAIT_MS) {
          setTimedOut(true)
          return
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
      }
    }

    loop()
    return () => { cancelled = true }
  }, [])

  return { ready, timedOut }
}
