import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { uploadAndAnalyze } from '../api/analysis'
import { bulkAddIngredients } from '../api/fridge'
import type { DetectedIngredient } from '../types'
import { useQuotaStore } from '../store/quotaStore'
import { getQuotaStatus } from '../api/recipes'

export default function Analyze() {
  const [items, setItems] = useState<DetectedIngredient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { setQuota } = useQuotaStore()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setLoading(true)
    setError(null)
    setDone(false)
    setItems([])

    try {
      const res = await uploadAndAnalyze(file)
      setItems(res.detected_ingredients)
      setDone(true)
      getQuotaStatus().then(setQuota).catch(() => {})
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { detail?: { error?: string; reset_date?: string } } } }
      const detail = anyErr.response?.data?.detail
      if (detail?.error === 'quota_exceeded') {
        setError(
          `월 분석 횟수를 모두 사용했습니다. ${
            detail.reset_date?.slice(0, 10) ?? ''
          } 초기화됩니다.`
        )
      } else if (detail?.error === 'analysis_timeout') {
        setError('분석 시간이 초과됐습니다. 다시 시도해주세요.')
      } else if (detail?.error === 'parsing_failed') {
        setError('식재료를 인식하지 못했습니다. 더 선명한 사진을 시도해주세요.')
      } else {
        setError('분석에 실패했습니다. 다시 시도해주세요.')
      }
      setPreview(null)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleApply = async () => {
    if (items.length === 0) return
    setApplying(true)
    try {
      await bulkAddIngredients(
        items.map((i) => ({
          name: i.name,
          quantity: i.quantity ?? undefined,
          unit: i.unit ?? undefined,
        }))
      )
      navigate('/fridge')
    } catch {
      setError('냉장고 반영에 실패했습니다.')
    } finally {
      setApplying(false)
    }
  }

  const handleReset = () => {
    setItems([])
    setDone(false)
    setError(null)
    setPreview(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-blue-600 text-sm">← 대시보드</Link>
        <h1 className="font-bold text-gray-800">📷 AI 사진 분석</h1>
        <div className="w-16" />
      </div>

      <div className="p-6 max-w-lg mx-auto">
        {/* Upload Area */}
        {!done && (
          <label
            className={`block border-2 border-dashed rounded-xl text-center cursor-pointer mb-6 transition overflow-hidden ${
              loading
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 bg-white'
            }`}
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-64 object-cover" />
            ) : (
              <div className="py-16 px-4">
                {loading ? (
                  <div>
                    <div className="text-4xl mb-3 animate-pulse">🔍</div>
                    <p className="text-blue-500 font-medium">AI가 식재료를 분석 중입니다...</p>
                    <p className="text-blue-400 text-sm mt-1">잠시만 기다려주세요 (최대 30초)</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-3">📸</div>
                    <p className="text-gray-600 font-medium">클릭하여 냉장고 사진 선택</p>
                    <p className="text-gray-400 text-sm mt-1">JPEG / PNG / WEBP, 최대 10MB</p>
                  </div>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              className="hidden"
              disabled={loading}
            />
          </label>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-4">
            <p className="font-medium">분석 실패</p>
            <p className="text-sm mt-1">{error}</p>
            {error.includes('횟수') && (
              <Link to="/subscription" className="inline-block mt-2 text-sm text-red-700 underline font-medium">
                Premium으로 업그레이드 →
              </Link>
            )}
            <button
              onClick={handleReset}
              className="block mt-2 text-sm text-red-500 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Results */}
        {done && items.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">
                인식된 재료 ({items.length}개)
              </h2>
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                다시 찍기
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">불필요한 항목을 제거한 후 반영하세요</p>

            <div className="space-y-2 mb-5">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <span className="font-medium text-gray-800">{item.name}</span>
                    {item.quantity != null && (
                      <span className="text-sm text-gray-500 ml-2">
                        {item.quantity}
                        {item.unit ?? ''}
                      </span>
                    )}
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        item.confidence >= 0.8
                          ? 'bg-green-100 text-green-600'
                          : item.confidence >= 0.6
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                  <button
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-sm transition ml-2"
                  >
                    제거
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleApply}
              disabled={applying || items.length === 0}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {applying ? '냉장고에 반영 중...' : `🧊 냉장고에 반영 (${items.length}개)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
