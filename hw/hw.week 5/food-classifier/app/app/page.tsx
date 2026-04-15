// food-classifier/app/app/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClassifierClient from './ClassifierClient'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const isPremium = data?.plan === 'premium'

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 mb-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🍽️ AI 음식 분류기</h1>
            <p className="text-gray-500 text-sm mt-1">
              사진을 업로드하거나 카메라로 촬영하면 AI가 음식을 분류합니다.
              {!isPremium && ' (무료: 하루 5회)'}
            </p>
          </div>

          {/* 계정 정보 */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">로그인 계정</p>
              <p className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
                {user.email}
              </p>
              <span className={`text-xs font-bold ${isPremium ? 'text-yellow-500' : 'text-gray-400'}`}>
                {isPremium ? '⭐ 프리미엄' : '무료 플랜'}
              </span>
            </div>
            <a
              href="/api/auth/logout"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap"
            >
              로그아웃
            </a>
          </div>
        </div>
      </div>
      <ClassifierClient isPremium={isPremium} />
    </main>
  )
}
