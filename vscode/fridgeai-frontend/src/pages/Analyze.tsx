import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { uploadAndAnalyze } from '../api/analysis'
import { bulkAddIngredients } from '../api/fridge'
import type { DetectedIngredient } from '../types'
import { useQuotaStore } from '../store/quotaStore'
import { getQuotaStatus } from '../api/recipes'

const MAX_IMAGES = 3

interface ImageItem {
  file: File
  preview: string
}

export default function Analyze() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [items, setItems] = useState<DetectedIngredient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [applying, setApplying] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newQty, setNewQty] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { setQuota } = useQuotaStore()

  const inputStyle: React.CSSProperties = {
    border: '1px solid #D3D1C7',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    fontFamily: 'inherit',
    background: '#fff',
    color: '#1A1A1A',
    outline: 'none',
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = MAX_IMAGES - images.length
    const toAdd = files.slice(0, remaining)
    const newItems: ImageItem[] = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setImages((prev) => [...prev, ...newItems])
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleAnalyze = async () => {
    if (images.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await uploadAndAnalyze(images.map((i) => i.file))
      setItems(res.detected_ingredients)
      setDone(true)
      getQuotaStatus().then(setQuota).catch(() => {})
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { detail?: { error?: string; reset_date?: string } } } }
      const detail = anyErr.response?.data?.detail
      if (detail?.error === 'quota_exceeded') {
        setError(`월 분석 횟수를 모두 사용했습니다. ${detail.reset_date?.slice(0, 10) ?? ''} 초기화됩니다.`)
      } else if (detail?.error === 'analysis_timeout') {
        setError('분석 시간이 초과됐습니다. 다시 시도해주세요.')
      } else if (detail?.error === 'parsing_failed') {
        setError('식재료를 인식하지 못했습니다. 더 선명한 사진을 시도해주세요.')
      } else {
        setError('분석에 실패했습니다. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    if (!newName.trim()) return
    setItems((prev) => [
      ...prev,
      { name: newName.trim(), quantity: newQty ? parseFloat(newQty) : null, unit: newUnit.trim() || null, confidence: 1 },
    ])
    setNewName(''); setNewQty(''); setNewUnit('')
  }

  const handleApply = async () => {
    if (items.length === 0) return
    setApplying(true)
    try {
      await bulkAddIngredients(items.map((i) => ({ name: i.name, quantity: i.quantity ?? undefined, unit: i.unit ?? undefined })))
      navigate('/fridge')
    } catch {
      setError('냉장고 반영에 실패했습니다.')
    } finally {
      setApplying(false)
    }
  }

  const handleReset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview))
    setImages([]); setItems([]); setDone(false); setError(null)
    setNewName(''); setNewQty(''); setNewUnit('')
  }

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>

      {/* ── Header ── */}
      <div className="px-5 py-4 flex items-center" style={{ background: '#0D1F1A', position: 'relative' }}>
        <Link
          to="/dashboard"
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ color: '#9FE1CB', border: '1px solid rgba(93,202,165,0.25)', zIndex: 1 }}
        >
          ← 대시보드
        </Link>
        <span style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 16,
          color: '#F1EFE8', letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>AI 사진 분석</span>
      </div>

      <div className="p-5 max-w-lg mx-auto">

        {/* ── 사진 선택 단계 ── */}
        {!done && (
          <>
            {images.length === 0 ? (
              <label
                className="block text-center cursor-pointer mb-4 transition-all"
                style={{ border: '1.5px dashed #C8C5BC', borderRadius: 16, background: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#C8C5BC')}
              >
                <div className="py-14 px-4">
                  <div className="text-5xl mb-3">📸</div>
                  <p className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>냉장고 사진을 선택하세요</p>
                  <p className="text-xs mt-1" style={{ color: '#888780' }}>최대 2장 첨부 가능 · JPEG / PNG / WEBP · 장당 최대 10MB</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} className="hidden" />
              </label>
            ) : (
              <div className={`mb-4 gap-3 ${images.length === 1 ? 'flex' : 'grid grid-cols-2'}`}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative flex-1 overflow-hidden"
                    style={{ borderRadius: 16, background: '#ECEAE3', aspectRatio: '4/3' }}
                  >
                    <img src={img.preview} alt={`사진 ${i + 1}`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setLightbox(img.preview)} />
                    {!loading && (
                      <button
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-2 right-2 flex items-center justify-center text-xs transition-all"
                        style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '50%', width: 28, height: 28 }}
                      >
                        ✕
                      </button>
                    )}
                    <div className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>
                      사진 {i + 1}
                    </div>
                  </div>
                ))}
                {images.length < MAX_IMAGES && !loading && (
                  <label
                    className="relative flex-1 flex flex-col items-center justify-center cursor-pointer transition-all"
                    style={{ border: '2px dashed #D3D1C7', borderRadius: 16, background: '#fff', aspectRatio: '4/3' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#D3D1C7')}
                  >
                    <span className="text-3xl mb-1" style={{ color: '#D3D1C7' }}>+</span>
                    <span className="text-xs" style={{ color: '#888780' }}>사진 추가</span>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} className="hidden" />
                  </label>
                )}
              </div>
            )}

            {loading && (
              <div className="text-center py-6 mb-4 rounded-2xl" style={{ background: '#fff', border: '0.5px solid #D3D1C7' }}>
                <div className="text-4xl mb-3 animate-pulse">🔍</div>
                <p className="font-semibold text-sm" style={{ color: '#1D9E75' }}>AI가 식재료를 분석 중입니다</p>
                <p className="text-xs mt-1" style={{ color: '#5DCAA5' }}>{images.length}장 분석 중 · 최대 30초 소요</p>
              </div>
            )}

            {images.length > 0 && !loading && (
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ border: '1px solid #D3D1C7', color: '#5F5E5A', background: '#fff' }}
                >
                  🗑 초기화
                </button>
                <button
                  onClick={handleAnalyze}
                  className="flex-[2] py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#1D9E75', color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#17845F')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#1D9E75')}
                >
                  🔍 분석하기 ({images.length}장 · 1회 차감)
                </button>
              </div>
            )}
          </>
        )}

        {/* ── 에러 ── */}
        {error && (
          <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(220,80,80,0.06)', border: '1px solid rgba(220,80,80,0.25)' }}>
            <p className="font-semibold text-sm" style={{ color: '#C0392B' }}>분석 실패</p>
            <p className="text-xs mt-1" style={{ color: '#C0392B' }}>{error}</p>
            {error.includes('횟수') && (
              <Link to="/subscription" className="inline-block mt-2 text-xs font-semibold underline" style={{ color: '#1D9E75' }}>
                Premium으로 업그레이드 →
              </Link>
            )}
            <button onClick={handleReset} className="block mt-2 text-xs underline" style={{ color: '#888780' }}>
              다시 시도
            </button>
          </div>
        )}

        {/* ── 분석 결과 ── */}
        {done && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '0.5px solid #D3D1C7' }}>
            {/* 분석된 사진 썸네일 */}
            {images.length > 0 && (
              <div className="px-5 pt-4 pb-2 flex gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden cursor-zoom-in"
                    style={{ width: images.length === 1 ? '100%' : '50%', aspectRatio: '16/9', borderRadius: 12, background: '#ECEAE3' }}
                    onClick={() => setLightbox(img.preview)}
                  >
                    <img src={img.preview} alt={`분석 사진 ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all" style={{ background: 'rgba(0,0,0,0.15)' }}>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>🔍 확대</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center px-5 pt-3 pb-3">
              <h2 className="font-bold text-sm" style={{ color: '#1A1A1A' }}>
                인식된 재료{' '}
                <span style={{ color: '#1D9E75' }}>{items.length}개</span>
              </h2>
              <button onClick={handleReset} className="text-xs" style={{ color: '#888780' }}>다시 찍기</button>
            </div>

            <div className="px-5 space-y-2 max-h-64 overflow-y-auto">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i < items.length - 1 ? '1px solid #F1EFE8' : 'none' }}>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={
                      item.confidence >= 0.8
                        ? { background: '#E1F5EE', color: '#1D9E75' }
                        : item.confidence >= 0.6
                        ? { background: 'rgba(250,199,117,0.2)', color: '#9A7A2A' }
                        : { background: '#F1EFE8', color: '#888780' }
                    }
                  >
                    {item.confidence < 1 ? `${Math.round(item.confidence * 100)}%` : '직접'}
                  </span>
                  <input
                    value={item.name}
                    onChange={(e) => setItems(items.map((it, j) => j === i ? { ...it, name: e.target.value } : it))}
                    className="flex-1 text-sm font-medium min-w-0"
                    style={{ ...inputStyle, padding: '4px 8px', width: '100%' }}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.quantity ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '' || /^\d*\.?\d*$/.test(v))
                        setItems(items.map((it, j) => j === i ? { ...it, quantity: v === '' ? null : parseFloat(v) || null } : it))
                    }}
                    placeholder="수량"
                    style={{ ...inputStyle, width: 60, padding: '4px 6px', textAlign: 'center' }}
                  />
                  <input
                    value={item.unit ?? ''}
                    onChange={(e) => setItems(items.map((it, j) => j === i ? { ...it, unit: e.target.value || null } : it))}
                    placeholder="단위"
                    style={{ ...inputStyle, width: 52, padding: '4px 6px' }}
                  />
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-sm flex-shrink-0 transition-all" style={{ color: '#C0392B' }}>✕</button>
                </div>
              ))}
            </div>

            {/* 재료 직접 추가 */}
            <div className="px-5 pt-3 pb-4 mt-2" style={{ borderTop: '1px solid #F1EFE8' }}>
              <p className="text-xs mb-2" style={{ color: '#888780' }}>재료 직접 추가</p>
              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  placeholder="재료 이름 *"
                  className="flex-1"
                  style={{ ...inputStyle, width: '100%' }}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={newQty}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '' || /^\d*\.?\d*$/.test(v)) setNewQty(v)
                  }}
                  placeholder="수량"
                  style={{ ...inputStyle, width: 60, padding: '8px 6px', textAlign: 'center' }}
                />
                <input
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  placeholder="단위"
                  style={{ ...inputStyle, width: 52, padding: '8px 6px' }}
                />
                <button
                  onClick={handleAddItem}
                  disabled={!newName.trim()}
                  className="text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-40 transition-all"
                  style={{ background: '#F1EFE8', color: '#1D9E75' }}
                >
                  추가
                </button>
              </div>
            </div>

            {/* 냉장고 반영 버튼 */}
            <div className="px-5 pb-5">
              <button
                onClick={handleApply}
                disabled={applying || items.length === 0}
                className="w-full py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50 transition-all"
                style={{ background: '#1D9E75', color: '#fff' }}
                onMouseEnter={e => { if (!applying && items.length > 0) (e.currentTarget as HTMLButtonElement).style.background = '#17845F' }}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#1D9E75'}
              >
                {applying ? '냉장고에 반영 중...' : `🧊 냉장고에 반영 (${items.length}개)`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 사진 확대 모달 */}
      {lightbox && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="확대 보기" className="max-w-full max-h-full object-contain" style={{ borderRadius: 16 }} onClick={(e) => e.stopPropagation()} />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 flex items-center justify-center text-xl transition-all"
            style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%', width: 40, height: 40 }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
