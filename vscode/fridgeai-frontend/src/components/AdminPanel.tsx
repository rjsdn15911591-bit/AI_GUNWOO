import { useEffect, useState, useCallback, useRef } from 'react'
import api from '../api/auth'
import { useQuotaStore } from '../store/quotaStore'
import { getQuotaStatus } from '../api/recipes'

type Step = 'closed' | 'password' | 'panel'

export default function AdminPanel() {
  const [step, setStep] = useState<Step>('closed')
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const tabHeld = useRef(false)
  const { setQuota } = useQuotaStore()

  // Tab + F12 동시 → 비밀번호 창
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      tabHeld.current = true
    }
    if (e.key === 'F12' && tabHeld.current) {
      e.preventDefault()
      setStep((s) => (s === 'closed' ? 'password' : 'closed'))
      setPw('')
      setPwError(false)
      setMessage(null)
    }
    if (e.key === 'Escape') {
      setStep('closed')
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      tabHeld.current = false
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // 비밀번호 제출 → 패널 진입 (실제 검증은 첫 API 호출에서)
  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pw.trim()) return
    setStep('panel')
    setPwError(false)
  }

  const call = async (endpoint: string, label: string) => {
    setLoading(label)
    setMessage(null)
    try {
      const res = await api.post(`/api/v1/admin/${endpoint}`, { secret: pw })
      setMessage({ text: res.data.message, ok: true })
      // 성공 후 쿼터 스토어 갱신
      getQuotaStatus().then(setQuota).catch(() => {})
    } catch (err: any) {
      if (err?.response?.status === 403) {
        // 비밀번호 틀림 → 다시 입력
        setStep('password')
        setPwError(true)
        setPw('')
      } else {
        setMessage({ text: err?.response?.data?.detail ?? '오류 발생', ok: false })
      }
    } finally {
      setLoading(null)
    }
  }

  if (step === 'closed') return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setStep('closed')}
      />

      <div className="relative bg-gray-900 text-white rounded-2xl shadow-2xl w-80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-4 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-0.5">🔐 제작자 전용</p>
          <h2 className="font-bold text-lg">
            {step === 'password' ? '관리자 인증' : '관리자 패널'}
          </h2>
        </div>

        <div className="p-5">
          {/* ── 비밀번호 입력 ── */}
          {step === 'password' && (
            <form onSubmit={handlePwSubmit} className="space-y-3">
              <p className="text-xs text-gray-400">비밀번호를 입력하세요</p>
              <input
                type="password"
                autoFocus
                value={pw}
                onChange={(e) => { setPw(e.target.value); setPwError(false) }}
                placeholder="비밀번호"
                className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ${
                  pwError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
              />
              {pwError && (
                <p className="text-xs text-red-400">비밀번호가 틀렸습니다</p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-2 text-sm font-semibold transition"
              >
                확인
              </button>
            </form>
          )}

          {/* ── 관리자 패널 ── */}
          {step === 'panel' && (
            <div className="space-y-2">
              {message && (
                <div className={`text-xs rounded-lg px-3 py-2 mb-3 ${
                  message.ok ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {message.ok ? '✅' : '❌'} {message.text}
                </div>
              )}

              <AdminBtn
                icon="🔄"
                label="한도 초기화"
                sub="이번 달 분석·레시피 사용량을 0으로 리셋"
                loading={loading === 'reset-quota'}
                onClick={() => call('reset-quota', 'reset-quota')}
              />
              <AdminBtn
                icon="⭐"
                label="관리자 풀 활성화"
                sub="Premium 구독 + 분석·레시피 한도 99,999회"
                loading={loading === 'set-pro'}
                onClick={() => call('set-pro', 'set-pro')}
              />
              <AdminBtn
                icon="💎"
                label="Premium 구독만 설정"
                sub="구독 Premium 전환 (한도 30회/월 유지)"
                loading={loading === 'set-premium'}
                onClick={() => call('set-premium', 'set-premium')}
              />
              <AdminBtn
                icon="🗑️"
                label="계정 정보 초기화"
                sub="냉장고 재료 + 사용량 전체 삭제"
                danger
                loading={loading === 'reset-account'}
                onClick={async () => {
                  if (!confirm('냉장고 재료와 모든 사용 기록이 삭제됩니다. 계속하시겠습니까?')) return
                  await call('reset-account', 'reset-account')
                }}
              />

              <button
                onClick={() => setStep('closed')}
                className="w-full mt-3 text-xs text-gray-500 hover:text-gray-300 py-2"
              >
                닫기 (ESC)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AdminBtn({
  icon, label, sub, danger = false, loading, onClick,
}: {
  icon: string
  label: string
  sub: string
  danger?: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition disabled:opacity-50 ${
        danger
          ? 'bg-red-900/50 hover:bg-red-800/60 border border-red-700/50'
          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
      }`}
    >
      <span className="text-xl">{loading ? '⏳' : icon}</span>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </button>
  )
}
