import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRecommendations } from '../api/recipes'
import type { Recipe } from '../types'

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getRecommendations()
      .then(setRecipes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getMatchBadgeColor = (matched: number, total: number) => {
    const ratio = total > 0 ? matched / total : 0
    if (ratio >= 1) return 'bg-green-100 text-green-700'
    if (ratio >= 0.7) return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-blue-600 text-sm">← 대시보드</Link>
        <h1 className="font-bold text-gray-800">🍳 레시피 추천</h1>
        <div className="w-16" />
      </div>

      <div className="p-6 max-w-lg mx-auto">
        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 animate-pulse">🍳</div>
            <p className="text-gray-400">냉장고 재료로 만들 수 있는 레시피를 찾는 중...</p>
          </div>
        )}

        {!loading && recipes.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🥗</p>
            <p className="font-medium">매칭되는 레시피가 없습니다</p>
            <p className="text-sm mt-1">냉장고에 재료를 추가하면 레시피를 추천해드립니다</p>
            <Link
              to="/fridge"
              className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              🧊 냉장고 관리
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {recipes.map((r) => {
            const totalIngredients = r.matched_count + r.missing_count
            const isFullMatch = r.missing_count === 0
            return (
              <div
                key={r.id}
                onClick={() => navigate(`/recipes/${r.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all active:scale-98"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">{r.title}</h3>
                    {r.ready_in_minutes && (
                      <p className="text-sm text-gray-500 mt-0.5">⏱ {r.ready_in_minutes}분</p>
                    )}
                  </div>
                  {isFullMatch && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0">
                      지금 바로!
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-2.5 flex-wrap">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${getMatchBadgeColor(
                      r.matched_count,
                      totalIngredients
                    )}`}
                  >
                    보유 {r.matched_count}개
                  </span>
                  {r.missing_count > 0 && (
                    <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      부족 {r.missing_count}개
                    </span>
                  )}
                </div>

                {r.missing_ingredients.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    필요: {r.missing_ingredients.join(', ')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
