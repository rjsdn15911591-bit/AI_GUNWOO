import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/auth'
import type { Subscription } from '../types'

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/api/v1/billing/status')
      .then((r) => setSub(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async () => {
    try {
      const resp = await api.post('/api/v1/billing/checkout')
      window.location.href = resp.data.checkout_url
    } catch {
      alert('결제 페이지 이동 중 오류가 발생했습니다.')
    }
  }

  const handleCancel = async () => {
    if (!confirm('구독을 취소하시겠습니까? 현재 결제 기간까지는 프리미엄 혜택이 유지됩니다.')) return
    try {
      await api.post('/api/v1/billing/cancel')
      alert('구독 취소 요청이 접수되었습니다.')
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
                {isPremium ? '⭐ Premium' : '🆓 Free'}
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

            {/* ── 플랜 비교 ── */}
            <div className="rounded-2xl p-5 mb-5" style={{ background: '#fff', border: '0.5px solid #D3D1C7' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: '#888780', textTransform: 'uppercase', marginBottom: 14 }}>Plan Comparison</p>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pb-2 font-medium text-xs" style={{ color: '#888780' }}>기능</th>
                    <th className="text-center pb-2 font-medium text-xs" style={{ color: '#888780' }}>무료</th>
                    <th className="text-center pb-2 font-semibold text-xs" style={{ color: '#1D9E75' }}>Premium ⭐</th>
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
                className="w-full py-4 rounded-2xl font-bold text-base transition-all"
                style={{ background: '#1D9E75', color: '#fff', boxShadow: '0 4px 16px rgba(29,158,117,0.25)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#17845F')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1D9E75')}
              >
                🚀 프리미엄으로 업그레이드
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
