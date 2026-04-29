import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/auth'
import type { Subscription } from '../types'

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const showSuccess = searchParams.get('success') === '1'

  const fetchStatus = () => {
    setLoading(true)
    api
      .get('/api/v1/billing/status')
      .then((r) => setSub(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStatus()
    if (showSuccess) {
      const t = setTimeout(() => {
        searchParams.delete('success')
        setSearchParams(searchParams, { replace: true })
      }, 5000)
      return () => clearTimeout(t)
    }
  }, [])

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const resp = await api.post('/api/v1/billing/checkout')
      window.location.href = resp.data.checkout_url
    } catch {
      alert('결제 페이지 이동 중 오류가 발생했습니다.')
      setUpgrading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('구독을 취소하시겠습니까? 현재 결제 기간까지는 프리미엄 혜택이 유지됩니다.')) return
    try {
      await api.post('/api/v1/billing/cancel')
      fetchStatus()
    } catch {
      alert('취소 처리 중 오류가 발생했습니다.')
    }
  }

  const isPremium = sub?.plan_type === 'premium'

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
        }}>구독 관리</span>
      </div>

      {/* ── 결제 성공 배너 ── */}
      {showSuccess && (
        <div
          className="px-5 py-3 flex items-center gap-2 text-sm font-medium"
          style={{ background: '#1D9E75', color: '#fff' }}
        >
          <span>✅</span>
          <span>프리미엄 구독이 완료되었습니다! 웹훅 처리 후 플랜이 업데이트됩니다.</span>
        </div>
      )}

      <div className="p-5 max-w-lg mx-auto">
        {loading ? (
          <p className="text-center py-10 text-sm" style={{ color: '#888780' }}>로딩 중...</p>
        ) : (
          <>
            {/* ── 현재 플랜 카드 ── */}
            <div
              className="rounded-2xl p-6 mb-5"
              style={
                isPremium
                  ? { background: '#0D1F1A', border: '0.5px solid #1D9E75' }
                  : { background: '#fff', border: '0.5px solid #D3D1C7' }
              }
            >
              <p className="text-xs font-medium mb-1" style={{ color: isPremium ? '#9FE1CB' : '#888780' }}>현재 플랜</p>
              <p
                className="text-3xl font-bold"
                style={{ color: isPremium ? '#5DCAA5' : '#1A1A1A', letterSpacing: '-0.03em' }}
              >
                {isPremium ? '💎 Premium' : '🆓 무료'}
              </p>
              {isPremium && sub?.current_period_end && (
                <p className="text-sm mt-2" style={{ color: '#9FE1CB' }}>
                  기간 종료: {new Date(sub.current_period_end).toLocaleDateString('ko-KR')}
                </p>
              )}
              {sub?.status === 'canceled' && (
                <p className="text-sm mt-2 font-medium" style={{ color: '#FAC775' }}>
                  ⚠ 구독이 취소됨 — 기간 종료 후 무료로 전환됩니다.
                </p>
              )}
              {sub?.status === 'past_due' && (
                <p className="text-sm mt-2 font-medium" style={{ color: '#FAC775' }}>
                  ⚠ 결제 실패 — 3일 내 재결제하지 않으면 무료로 전환됩니다.
                </p>
              )}
            </div>

            {/* ── 첫 구매 30일 무료 혜택 안내 (비프리미엄 전용) ── */}
            {!isPremium && (
              <div
                className="rounded-2xl p-5 mb-5 flex items-start gap-4"
                style={{ background: 'linear-gradient(135deg, #0D1F1A 0%, #133027 100%)', border: '1.5px solid #1D9E75' }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(29,158,117,0.2)' }}>
                  🎁
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm mb-0.5" style={{ color: '#5DCAA5' }}>첫 구매 30일 무료 체험</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#9FE1CB' }}>
                    프리미엄 플랜 최초 구독 시 30일 무료로 사용해 보세요.<br />
                    AI 레시피 월 30회 · 냉장고 분석 월 30회 — 언제든 취소 가능합니다.
                  </p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#FAC775' }}>
                    ★ 체험 기간 내 취소 시 요금 없음
                  </p>
                </div>
              </div>
            )}

            {/* ── 플랜 비교 ── */}
            <div className="rounded-2xl p-5 mb-5" style={{ background: '#fff', border: '0.5px solid #D3D1C7' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: '#888780', textTransform: 'uppercase', marginBottom: 14 }}>Plan Comparison</p>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pb-2 font-medium text-xs" style={{ color: '#888780' }}>기능</th>
                    <th className="text-center pb-2 font-medium text-xs" style={{ color: '#888780' }}>무료</th>
                    <th className="text-center pb-2 font-semibold text-xs" style={{ color: '#1D9E75' }}>Premium 💎</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['월 냉장고 분석', '5회', '30회'],
                    ['월 AI 레시피 생성', '10회', '30회'],
                    ['레시피 추천', '✅', '✅'],
                    ['식재료 관리', '✅', '✅'],
                    ['냉장고 관리', '✅', '✅'],
                  ].map(([feature, free, premium]) => (
                    <tr key={feature} style={{ borderTop: '1px solid #F1EFE8' }}>
                      <td className="py-2.5 text-xs" style={{ color: '#1A1A1A' }}>{feature}</td>
                      <td className="py-2.5 text-center text-xs" style={{ color: '#888780' }}>{free}</td>
                      <td className="py-2.5 text-center text-xs font-semibold" style={{ color: '#1D9E75' }}>{premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── CTA ── */}
            {!isPremium ? (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-70"
                style={{ background: '#1D9E75', color: '#fff', boxShadow: '0 4px 16px rgba(29,158,117,0.25)', cursor: upgrading ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!upgrading) e.currentTarget.style.background = '#17845F' }}
                onMouseLeave={e => { if (!upgrading) e.currentTarget.style.background = '#1D9E75' }}
              >
                {upgrading ? '결제 페이지로 이동 중...' : '💎 프리미엄으로 업그레이드'}
              </button>
            ) : sub?.status === 'active' ? (
              <button
                onClick={handleCancel}
                className="w-full py-3 rounded-2xl text-sm transition-all"
                style={{ border: '1px solid #D3D1C7', color: '#888780', background: '#fff' }}
              >
                구독 취소
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
