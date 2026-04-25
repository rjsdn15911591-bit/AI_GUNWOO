import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuotaStore } from '../store/quotaStore'
import { getQuotaStatus } from '../api/recipes'
import { logout } from '../api/auth'

export default function Dashboard() {
  const { user } = useAuth()
  const { quota, setQuota } = useQuotaStore()

  useEffect(() => {
    getQuotaStatus().then(setQuota).catch(console.error)
  }, [])

  const handleLogout = async () => {
    await logout().catch(() => {})
    window.location.href = '/'
  }

  const quickActions = [
    { to: '/fridge', icon: '🧊', label: '냉장고 관리', bg: 'bg-white hover:bg-gray-50', text: 'text-gray-700' },
    { to: '/analyze', icon: '📷', label: 'AI 사진 분석', bg: 'bg-blue-600 hover:bg-blue-700', text: 'text-white' },
    { to: '/recipes', icon: '🍳', label: '레시피 추천', bg: 'bg-white hover:bg-gray-50', text: 'text-gray-700' },
    { to: '/subscription', icon: '⭐', label: '구독 관리', bg: 'bg-white hover:bg-gray-50', text: 'text-gray-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧊</span>
          <span className="font-bold text-blue-700 text-lg">FridgeAI</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 transition"
        >
          로그아웃
        </button>
      </div>

      <div className="p-6 max-w-lg mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            안녕하세요, {user?.display_name ?? '사용자'}님! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">오늘의 식재료 현황을 확인하세요</p>
        </div>

        {/* Quota Card */}
        {quota && (
          <div
            className={`rounded-xl p-5 shadow mb-6 border-l-4 ${
              quota.plan_type === 'premium'
                ? 'bg-gradient-to-r from-purple-50 to-white border-purple-500'
                : quota.remaining <= 1
                ? 'bg-gradient-to-r from-orange-50 to-white border-orange-400'
                : 'bg-gradient-to-r from-blue-50 to-white border-blue-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">이번 달 AI 분석 사용량</p>
                <p className="text-3xl font-bold text-blue-600">
                  {quota.usage_count}
                  <span className="text-gray-400 text-lg font-normal">
                    {' '}
                    / {quota.plan_type === 'premium' ? '무제한' : quota.limit_count}
                  </span>
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  quota.plan_type === 'premium'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {quota.plan_type === 'premium' ? '⭐ Premium' : 'Free'}
              </span>
            </div>
            {quota.plan_type === 'free' && (
              <div className="mt-3">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      quota.remaining <= 1 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (quota.usage_count / quota.limit_count) * 100)}%` }}
                  />
                </div>
                {quota.remaining <= 1 && (
                  <p className="text-orange-500 text-xs mt-2">
                    ⚠ 잔여 횟수가 {quota.remaining}회 남았습니다.{' '}
                    <Link to="/subscription" className="underline font-medium">
                      업그레이드
                    </Link>
                  </p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(quota.reset_date).toLocaleDateString('ko-KR')} 초기화
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="font-semibold text-gray-700 mb-3">빠른 메뉴</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ to, icon, label, bg, text }) => (
            <Link
              key={to}
              to={to}
              className={`${bg} ${text} rounded-xl p-5 shadow-sm text-center hover:shadow-md transition-all active:scale-95`}
            >
              <div className="text-3xl mb-2">{icon}</div>
              <p className="font-semibold text-sm">{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
