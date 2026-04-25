import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFridge, addIngredient, deleteIngredient } from '../api/fridge'
import type { Refrigerator, Ingredient } from '../types'

export default function Fridge() {
  const [fridge, setFridge] = useState<Refrigerator | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [quantity, setQuantity] = useState('')
  const [adding, setAdding] = useState(false)

  const load = () => {
    setLoading(true)
    getFridge()
      .then(setFridge)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async () => {
    if (!name.trim()) return
    setAdding(true)
    try {
      await addIngredient({
        name: name.trim(),
        unit: unit.trim() || undefined,
        quantity: quantity ? parseFloat(quantity) : undefined,
      })
      setName('')
      setUnit('')
      setQuantity('')
      load()
    } catch (e) {
      console.error(e)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 재료를 삭제하시겠습니까?')) return
    await deleteIngredient(id).catch(console.error)
    load()
  }

  const isExpiringSoon = (expiry: string | null) => {
    if (!expiry) return false
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
    return days <= 3 && days >= 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-blue-600 text-sm">← 대시보드</Link>
        <h1 className="font-bold text-gray-800">🧊 냉장고 관리</h1>
        <div className="w-16" />
      </div>

      <div className="p-6 max-w-lg mx-auto">
        {/* Add Form */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">재료 추가</h2>
          <div className="flex gap-2 mb-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="재료 이름 *"
              className="border border-gray-200 rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="수량"
              type="number"
              className="border border-gray-200 rounded-lg px-3 py-2 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="단위"
              className="border border-gray-200 rounded-lg px-3 py-2 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !name.trim()}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {adding ? '추가 중...' : '+ 재료 추가'}
          </button>
        </div>

        {/* Ingredient List */}
        {loading ? (
          <p className="text-center text-gray-400 py-10">로딩 중...</p>
        ) : (
          <div className="space-y-2">
            {fridge?.ingredients.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🥬</p>
                <p className="font-medium">냉장고가 비어있습니다</p>
                <p className="text-sm mt-1">재료를 추가하거나 사진을 찍어 AI 분석을 시작하세요</p>
                <Link
                  to="/analyze"
                  className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  📷 AI 사진 분석
                </Link>
              </div>
            )}
            {fridge?.ingredients.map((ing: Ingredient) => (
              <div
                key={ing.id}
                className={`bg-white rounded-lg p-3.5 shadow-sm flex justify-between items-center border ${
                  isExpiringSoon(ing.expiry_date)
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">{ing.name}</span>
                    {ing.quantity != null && (
                      <span className="text-sm text-gray-500">
                        {ing.quantity}{ing.unit ?? ''}
                      </span>
                    )}
                    {ing.source === 'ai_analysis' && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                        AI
                      </span>
                    )}
                    {isExpiringSoon(ing.expiry_date) && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                        ⚠ 유통기한 임박
                      </span>
                    )}
                  </div>
                  {ing.expiry_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      유통기한: {ing.expiry_date}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(ing.id)}
                  className="text-red-400 hover:text-red-600 text-sm ml-3 flex-shrink-0 transition"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {fridge && fridge.ingredients.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            총 {fridge.ingredients.length}개 재료 등록됨
          </p>
        )}
      </div>
    </div>
  )
}
