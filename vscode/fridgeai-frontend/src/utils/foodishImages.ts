/**
 * 레시피 대표 사진 유틸 — Pexels + Pixabay 이중 API
 * 1차: Pexels API (이미 키 보유)
 * 2차 fallback: Pixabay API (VITE_PIXABAY_API_KEY 설정 시 활성화)
 * 결과는 localStorage 에 캐시되어 재사용됩니다.
 */

const CACHE_KEY = 'progio_recipe_images_v3'
const PEXELS_BASE = 'https://api.pexels.com/v1/search'
const PIXABAY_BASE = 'https://pixabay.com/api/'

function getPexelsKey(): string {
  return import.meta.env.VITE_PEXELS_API_KEY ?? ''
}

function getPixabayKey(): string {
  return import.meta.env.VITE_PIXABAY_API_KEY ?? ''
}

export type ImageSource = { query: string }

function getCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') } catch { return {} }
}
function saveCache(cache: Record<string, string>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch {}
}

async function fetchFromPexels(query: string): Promise<string | null> {
  const key = getPexelsKey()
  if (!key) return null
  try {
    const url = `${PEXELS_BASE}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`
    const res = await fetch(url, { headers: { Authorization: key } })
    if (!res.ok) return null
    const data: { photos: { src: { medium: string } }[] } = await res.json()
    return data.photos?.[0]?.src?.medium ?? null
  } catch {
    return null
  }
}

async function fetchFromPixabay(query: string): Promise<string | null> {
  const key = getPixabayKey()
  if (!key) return null
  try {
    const params = new URLSearchParams({
      key,
      q: query,
      image_type: 'photo',
      category: 'food',
      per_page: '3',
      safesearch: 'true',
    })
    const res = await fetch(`${PIXABAY_BASE}?${params}`)
    if (!res.ok) return null
    const data: { hits: { webformatURL: string }[] } = await res.json()
    return data.hits?.[0]?.webformatURL ?? null
  } catch {
    return null
  }
}

async function fetchOne(query: string): Promise<string | null> {
  // 1차: Pexels
  const pexels = await fetchFromPexels(query)
  if (pexels) return pexels

  // 2차 fallback: Pixabay
  return fetchFromPixabay(query)
}

export async function fetchRecipeImages(
  items: Array<{ id: string; src: ImageSource }>
): Promise<Record<string, string>> {
  const cache = getCache()
  const missing = items.filter((i) => !cache[i.id])
  if (missing.length === 0) return cache

  // 동시 요청 최대 5개씩 나눠서 처리
  for (let i = 0; i < missing.length; i += 5) {
    const chunk = missing.slice(i, i + 5)
    const results = await Promise.allSettled(
      chunk.map((item) =>
        fetchOne(item.src.query).then((url) => ({ id: item.id, url }))
      )
    )
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.url) {
        cache[r.value.id] = r.value.url
      }
    }
  }

  saveCache(cache)
  return { ...cache }
}

export function getCachedImage(id: string): string | null {
  return getCache()[id] ?? null
}

/**
 * 외부 이미지 URL을 백엔드 프록시로 변환 (CORB 방지)
 * Wikipedia, Pexels 등 cross-origin 이미지에 사용
 */
export function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  // 이미 프록시 URL이면 그대로
  if (url.includes('/api/v1/image-proxy')) return url
  // 같은 origin이면 그대로
  if (url.startsWith('/') || url.startsWith(window.location.origin)) return url
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return `${base}/api/v1/image-proxy?url=${encodeURIComponent(url)}`
}
