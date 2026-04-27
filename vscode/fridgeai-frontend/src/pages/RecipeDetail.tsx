import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { getRecipeDetail } from '../api/recipes'
import { isBookmarked, toggleBookmark } from '../utils/bookmarks'
import { fetchRecipeImages, getCachedImage, proxyImageUrl } from '../utils/foodishImages'
import { RECIPE_IMAGE_MAP } from '../utils/recipeImageMap'

interface RecipeDetail {
  id: string
  title: string
  category?: string
  serving?: string
  ready_in_minutes: number | null
  image: string | null
  ingredients: string[]
  ingredients_detail: string[]
  instructions: { step: number; description: string }[]
  tips: string | null
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [extraImage, setExtraImage] = useState<string | null>(null)

  // 이미지 없는 레시피 → Foodish/Pexels 에서 가져오기
  useEffect(() => {
    if (!id || !RECIPE_IMAGE_MAP[id]) return
    const cached = getCachedImage(id)
    if (cached) { setExtraImage(cached); return }
    fetchRecipeImages([{ id, src: RECIPE_IMAGE_MAP[id] }])
      .then((map) => setExtraImage(map[id] ?? null))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (id === 'ai-generated' && location.state?.recipe) {
      const r = location.state.recipe as RecipeDetail
      setRecipe(r)
      setLoading(false)
      setBookmarked(isBookmarked(r.id ?? 'ai-generated'))
      return
    }
    if (id) {
      getRecipeDetail(id)
        .then((r) => { setRecipe(r); setBookmarked(isBookmarked(r.id ?? id)) })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [id, location.state])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F8F5' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🍳</div>
          <p className="text-sm" style={{ color: '#888780' }}>레시피를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F9F8F5' }}>
        <p style={{ color: '#888780' }}>레시피를 찾을 수 없습니다</p>
        <Link to="/recipes" className="mt-4 text-sm font-medium" style={{ color: '#1D9E75' }}>← 레시피 목록</Link>
      </div>
    )
  }

  const isAI = id === 'ai-generated' || (recipe?.id as string)?.startsWith('ai-')
  const heroImage: string | null = proxyImageUrl(recipe.image ?? extraImage)

  return (
    <div className="min-h-screen" style={{ background: '#F9F8F5' }}>

      {/* ── Header ── */}
      <div
        className="px-5 py-4 flex justify-between items-center sticky top-0 z-10"
        style={{ background: '#0D1F1A' }}
      >
        <Link
          to="/recipes"
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ color: '#9FE1CB', border: '1px solid rgba(93,202,165,0.25)' }}
        >
          ← 목록
        </Link>
        <h1 className="font-bold text-sm truncate max-w-[180px]" style={{ color: '#F1EFE8' }}>{recipe.title}</h1>
        <div className="w-10" />
      </div>

      {/* AI 배지 */}
      {isAI && (
        <div className="text-center py-2 text-xs font-semibold" style={{ background: '#1D9E75', color: '#E1F5EE' }}>
          ✨ AI가 냉장고 재료로 생성한 맞춤 레시피
        </div>
      )}

      {/* Hero 이미지 */}
      {heroImage && !imgError ? (
        <div className="w-full h-52 overflow-hidden" style={{ background: '#ECEAE3' }}>
          <img src={heroImage} alt={recipe.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        </div>
      ) : (
        <div className="w-full h-36 flex items-center justify-center" style={{ background: isAI ? '#E1F5EE' : '#F1EFE8' }}>
          <span className="text-6xl">{isAI ? '🤖' : '🍽️'}</span>
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto space-y-3">

        {/* 기본 정보 */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '0.5px solid #D3D1C7' }}>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold leading-tight" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>{recipe.title}</h2>
            {recipe.category && (
              <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded font-medium" style={{ background: '#F1EFE8', color: '#5F5E5A' }}>
                {recipe.category}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: '#1D9E75' }}>
              👤 {recipe.serving ?? '1인분 기준'}
            </span>
            {recipe.ready_in_minutes && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#F1EFE8', color: '#5F5E5A' }}>
                ⏱ 조리 {recipe.ready_in_minutes}분
              </span>
            )}
            {recipe.instructions?.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#F1EFE8', color: '#5F5E5A' }}>
                📋 {recipe.instructions.length}단계
              </span>
            )}
          </div>
        </div>

        {/* 레시피 저장 버튼 */}
        <button
          onClick={() => {
            const saved = toggleBookmark({
              id: recipe.id ?? id ?? 'unknown',
              title: recipe.title,
              category: recipe.category,
              serving: recipe.serving,
              ready_in_minutes: recipe.ready_in_minutes,
              image: recipe.image,
            })
            setBookmarked(saved)
          }}
          className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={
            bookmarked
              ? { background: 'rgba(250,199,117,0.15)', border: '1.5px solid #FAC775', color: '#9A7A2A' }
              : { background: '#fff', border: '1.5px solid #D3D1C7', color: '#5F5E5A' }
          }
          onMouseEnter={e => { if (!bookmarked) (e.currentTarget as HTMLButtonElement).style.borderColor = '#1D9E75' }}
          onMouseLeave={e => { if (!bookmarked) (e.currentTarget as HTMLButtonElement).style.borderColor = '#D3D1C7' }}
        >
          <span className="text-lg">{bookmarked ? '🔖' : '🤍'}</span>
          <span>{bookmarked ? '저장됨 (탭하여 취소)' : '레시피 저장'}</span>
        </button>

        {/* 재료 */}
        {((recipe.ingredients_detail?.length ?? 0) > 0 || recipe.ingredients?.length > 0) && (
          <div className="rounded-2xl p-4" style={{ background: '#fff', border: '0.5px solid #D3D1C7' }}>
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm" style={{ color: '#1A1A1A' }}>
              🛒 재료
              <span className="text-xs font-normal" style={{ color: '#888780' }}>(1T=15ml · 1t=5ml · 1C=200ml)</span>
            </h3>
            <ul className="space-y-1.5">
              {(recipe.ingredients_detail?.length ? recipe.ingredients_detail : recipe.ingredients).map((ing, i) => {
                if (ing.startsWith('──') || ing.startsWith('─')) {
                  return (
                    <li key={i} className="text-xs font-semibold pt-1 pb-0.5 mt-1" style={{ color: '#888780', borderTop: '1px solid #F1EFE8' }}>
                      {ing}
                    </li>
                  )
                }
                return (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#1A1A1A' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: '#1D9E75' }} />
                    <span className="leading-relaxed">{ing}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* 조리 방법 */}
        {recipe.instructions?.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: '#fff', border: '0.5px solid #D3D1C7' }}>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm" style={{ color: '#1A1A1A' }}>
              👨‍🍳 조리 방법
            </h3>
            <ol className="space-y-4">
              {recipe.instructions.map((inst) => {
                const lines = inst.description.split('\n')
                const mainLine = lines[0]
                const notes = lines.slice(1)
                return (
                  <li key={inst.step} className="flex gap-3">
                    <span
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: '#1D9E75' }}
                    >
                      {inst.step}
                    </span>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm leading-relaxed font-medium" style={{ color: '#1A1A1A' }}>{mainLine}</p>
                      {notes.map((note, ni) => {
                        const isWarn = note.startsWith('⚠️')
                        const isTip = note.startsWith('👉')
                        return (
                          <p
                            key={ni}
                            className="text-xs mt-1 leading-relaxed"
                            style={
                              isWarn
                                ? { color: '#C0392B', background: 'rgba(220,80,80,0.06)', borderRadius: 4, padding: '2px 6px' }
                                : isTip
                                ? { color: '#1D9E75' }
                                : { color: '#5F5E5A' }
                            }
                          >
                            {note}
                          </p>
                        )
                      })}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {/* 요리 팁 */}
        {recipe.tips && (
          <div className="rounded-2xl p-4" style={{ background: '#E1F5EE', border: '0.5px solid #5DCAA5' }}>
            <h3 className="font-bold mb-2 flex items-center gap-2 text-sm" style={{ color: '#1D9E75' }}>
              💡 요리 팁
            </h3>
            <div className="space-y-1">
              {recipe.tips.split('\n').map((line, i) => (
                <p
                  key={i}
                  className="text-xs leading-relaxed"
                  style={{ color: i === 0 ? '#1D9E75' : '#5F5E5A', fontWeight: i === 0 ? 600 : 400 }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
