import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRecipeDetail } from '../api/recipes'

interface RecipeDetail {
  id: string
  title: string
  ready_in_minutes: number | null
  ingredients: string[]
  instructions: { step: number; description: string }[]
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      getRecipeDetail(id)
        .then(setRecipe)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">레시피를 불러오는 중...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-400">레시피를 찾을 수 없습니다</p>
        <Link to="/recipes" className="mt-4 text-blue-600 text-sm">← 레시피 목록</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link to="/recipes" className="text-blue-600 text-sm">← 레시피 목록</Link>
        <h1 className="font-bold text-gray-800 truncate max-w-xs">{recipe.title}</h1>
        <div className="w-16" />
      </div>

      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{recipe.title}</h2>
          {recipe.ready_in_minutes && (
            <p className="text-gray-500 text-sm">⏱ 조리 시간: {recipe.ready_in_minutes}분</p>
          )}
        </div>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-semibold text-gray-700 mb-3">재료</h3>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recipe.instructions && recipe.instructions.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3">조리 방법</h3>
            <ol className="space-y-3">
              {recipe.instructions.map((inst) => (
                <li key={inst.step} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {inst.step}
                  </span>
                  <p className="text-sm text-gray-600 leading-relaxed">{inst.description}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
