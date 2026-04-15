// food-classifier/app/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  return (
    <main className="min-h-screen bg-white">
      {/* 헤더 */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-xl font-bold text-brand">🍽️ FoodAI</span>
        {user ? (
          <Link href="/app" className="px-4 py-2 bg-brand text-white rounded-full text-sm">
            앱 열기
          </Link>
        ) : (
          <Link href="/api/auth/login?provider=google"
            className="px-4 py-2 bg-brand text-white rounded-full text-sm">
            시작하기
          </Link>
        )}
      </nav>

      {/* 히어로 */}
      <section className="py-24 px-6 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          사진 한 장으로<br />
          <span className="text-brand">음식을 AI가 분류</span>합니다
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          모바일 카메라 지원 · 브라우저에서 바로 실행 · 설치 불필요
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href={user ? '/app' : '/api/auth/login?provider=google'}
            className="px-8 py-3 bg-brand text-white rounded-full text-lg font-semibold hover:bg-brand-dark">
            무료로 시작하기
          </Link>
          <Link href="/pricing"
            className="px-8 py-3 border border-gray-300 rounded-full text-lg hover:bg-gray-50">
            요금제 보기
          </Link>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: '🧠', title: 'Transfer Learning', desc: 'ImageNet 사전학습 MobileNetV2로 정확한 분류' },
            { icon: '🔥', title: 'Grad-CAM', desc: 'AI가 어느 부분을 보고 판단했는지 히트맵으로 시각화' },
            { icon: '📱', title: 'PWA · 카메라', desc: '홈 화면 설치 후 카메라로 즉시 촬영 · 분류' },
            { icon: '⚡', title: 'TTA 앙상블', desc: '5-crop 평균으로 단일 추론 대비 정확도 향상' },
            { icon: '🎯', title: 'Temperature Scaling', desc: '신뢰도 과신 방지 — 보정된 확률 제공' },
            { icon: '🔒', title: '오프라인 동작', desc: '모델 캐시 후 인터넷 없이도 분류 가능' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
