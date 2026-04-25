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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-blue-600 text-sm">← 대시보드</Link>
        <h1 className="font-bold text-gray-800">⭐ 구독 관리</h1>
        <div className="w-16" />
      </div>

      <div className="p-6 max-w-lg mx-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-10">로딩 중...</p>
        ) : (
          <>
            {/* Current Plan */}
            <div
              className={`rounded-xl p-6 shadow-sm mb-6 border ${
                sub?.plan_type === 'premium'
                  ? 'bg-gradient-to-r from-purple-50 to-white border-purple-200'
                  : 'bg-white border-gray-100'
              }`}
            >
              <p className="text-sm text-gray-500 mb-1">현재 플랜</p>
              <p className="text-3xl font-bold text-blue-600">
                {sub?.plan_type === 'premium' ? '⭐ Premium' : '🆓 Free'}
              </p>
              {sub?.plan_type === 'premium' && sub?.current_period_end && (
                <p className="text-sm text-gray-400 mt-2">
                  기간 종료:{' '}
                  {new Date(sub.current_period_end).toLocaleDateString('ko-KR')}
                </p>
              )}
              {sub?.status === 'canceled' && (
                <p className="text-orange-500 text-sm mt-2">
                  ⚠ 구독이 취소됨. 기간 종료 후 무료로 전환됩니다.
                </p>
              )}
              {sub?.status === 'past_due' && (
                <p className="text-red-500 text-sm mt-2">
                  ⚠ 결제 실패. 3일 내 재결제하지 않으면 무료로 전환됩니다.
                </p>
              )}
            </div>

            {/* Plan Comparison */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h2 className="font-bold text-gray-800 mb-4">플랜 비교</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-gray-500 pb-2 font-medium">기능</th>
                      <th className="text-center text-gray-500 pb-2 font-medium">무료</th>
                      <th className="text-center text-blue-600 pb-2 font-medium">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    {[
                      ['월 AI 분석', '5회', '무제한'],
                      ['레시피 추천', '✅', '✅'],
                      ['식재료 관리', '✅', '✅'],
                      ['냉장고 관리', '✅', '✅'],
                    ].map(([feature, free, premium]) => (
                      <tr key={feature} className="border-t border-gray-50">
                        <td className="py-2 text-gray-600">{feature}</td>
                        <td className="py-2 text-center text-gray-500">{free}</td>
                        <td className="py-2 text-center text-blue-600 font-medium">{premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA */}
            {sub?.plan_type !== 'premium' ? (
              <button
                onClick={handleUpgrade}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 active:bg-blue-800 transition shadow-md"
              >
                🚀 무제한으로 업그레이드
              </button>
            ) : sub?.status === 'active' ? (
              <button
                onClick={handleCancel}
                className="w-full border border-gray-300 text-gray-500 py-3 rounded-xl text-sm hover:bg-gray-50 transition"
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
