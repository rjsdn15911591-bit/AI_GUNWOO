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
    { to: '/fridge',       icon: '🧊', label: '냉장고 관리',  primary: false },
    { to: '/analyze',      icon: '📷', label: 'AI 사진 분석', primary: true  },
    { to: '/recipes',      icon: '🍳', label: '레시피 추천',  primary: false },
    { to: '/subscription', icon: '⭐', label: '구독 관리',    primary: false },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#EDE9E1' }}>

      {/* ── Header ── */}
      <div
        className="px-6 py-4 flex justify-between items-center"
        style={{ background: '#0D1F1A' }}
      >
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="24" height="28" rx="4" stroke="#5DCAA5" strokeWidth="2"/>
            <line x1="6" y1="13" x2="30" y2="13" stroke="#5DCAA5" strokeWidth="2"/>
            <circle cx="24" cy="20" r="2" fill="#5DCAA5"/>
          </svg>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em' }}>
            <span style={{ color: '#F1EFE8' }}>Pri</span>
            <span style={{ color: '#5DCAA5' }}>gio</span>
            <span style={{ color: '#5DCAA5' }}>.</span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
          style={{ color: '#9FE1CB', border: '1px solid rgba(93,202,165,0.25)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(93,202,165,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          로그아웃
        </button>
      </div>

      <div className="p-5 max-w-lg mx-auto">

        {/* ── Welcome ── */}
        <div className="mb-5 pt-1">
          <p style={{ fontFamily: "'Inter', sans-serif", color: '#888780', fontSize: 10, letterSpacing: '0.18em', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase' }}>
            Dashboard
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em', margin: 0 }}>
            안녕하세요, {user?.display_name ?? '사용자'}님
          </h1>
          <p className="text-sm mt-1" style={{ color: '#5F5E5A' }}>오늘의 식재료 현황을 확인하세요</p>
        </div>

        {/* ── Quota Card ── */}
        {quota && (
          <div
            className="rounded-2xl p-5 mb-5"
            style={{
              background: '#fff',
              border: '0.5px solid #D3D1C7',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#5F5E5A' }}>
                  이번 달 AI 분석 사용량
                </p>
                <p className="text-3xl font-bold" style={{ color: '#1A1A1A', letterSpacing: '-0.03em' }}>
                  {quota.analysis_usage}
                  <span className="text-base font-normal ml-1" style={{ color: '#888780' }}>
                    / {quota.analysis_limit >= 99999 ? '무제한' : quota.analysis_limit}
                  </span>
                </p>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={
                  quota.plan_type === 'premium'
                    ? { background: '#E1F5EE', color: '#1D9E75' }
                    : { background: '#F1EFE8', color: '#5F5E5A' }
                }
              >
                {quota.plan_type === 'premium' ? '⭐ Premium' : 'Free'}
              </span>
            </div>

            {quota.analysis_limit < 99999 && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F1EFE8' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (quota.analysis_usage / quota.analysis_limit) * 100)}%`,
                      background: quota.analysis_remaining <= 1 ? '#FAC775' : '#1D9E75',
                    }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  {quota.plan_type === 'free' && quota.analysis_remaining <= 1 ? (
                    <p className="text-xs font-medium" style={{ color: '#FAC775' }}>
                      ⚠ 잔여 횟수 부족 —{' '}
                      <Link to="/subscription" className="underline" style={{ color: '#1D9E75' }}>
                        업그레이드
                      </Link>
                    </p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs ml-auto" style={{ color: '#888780' }}>
                    {new Date(quota.reset_date).toLocaleDateString('ko-KR')} 초기화 · 잔여 {quota.analysis_remaining}회
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Quick Actions ── */}
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: '#888780', textTransform: 'uppercase', marginBottom: 12 }}>
          Quick Menu
        </p>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ to, icon, label, primary }) => (
            <Link
              key={to}
              to={to}
              className="rounded-2xl p-5 text-center transition-all active:scale-95"
              style={
                primary
                  ? {
                      background: '#1D9E75',
                      color: '#fff',
                      boxShadow: '0 2px 12px rgba(29,158,117,0.2)',
                    }
                  : {
                      background: '#fff',
                      color: '#1A1A1A',
                      border: '0.5px solid #D3D1C7',
                    }
              }
              onMouseEnter={e => {
                if (!primary) (e.currentTarget as HTMLElement).style.background = '#F5F3EE'
              }}
              onMouseLeave={e => {
                if (!primary) (e.currentTarget as HTMLElement).style.background = '#fff'
              }}
            >
              <div className="text-3xl mb-2">{icon}</div>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 600, fontSize: 13 }}>{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
