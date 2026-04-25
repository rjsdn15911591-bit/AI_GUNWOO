import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getGoogleLoginUrl } from '../api/auth'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleLogin = async () => {
    try {
      const url = await getGoogleLoginUrl()
      window.location.href = url
    } catch {
      alert('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-4">
      <div className="text-6xl mb-4">🧊</div>
      <h1 className="text-4xl font-bold text-blue-700 mb-3 text-center">FridgeAI</h1>
      <p className="text-gray-600 text-center mb-2 max-w-md text-lg">
        냉장고 속 재료를 찍으면, 오늘 저녁 뭐 먹을지 고민 끝.
      </p>
      <p className="text-gray-500 text-center mb-10 text-sm">
        AI가 식재료를 자동으로 인식하고 검증된 레시피를 추천해 드립니다.
      </p>

      <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-sm border border-gray-100">
        <div className="mb-6 space-y-2">
          {[
            { icon: '📷', text: '사진 한 장으로 자동 재료 인식' },
            { icon: '🍳', text: '보유 재료 기반 레시피 추천' },
            { icon: '📋', text: '유통기한 관리로 식재료 낭비 절감' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-gray-600">
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-400 mb-4 text-center bg-gray-50 rounded-lg py-2">
          무료 플랜: 월 5회 AI 분석 제공
        </div>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition font-medium text-gray-700 shadow-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 시작하기
        </button>
      </div>
    </div>
  )
}
