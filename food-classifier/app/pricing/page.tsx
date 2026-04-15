// food-classifier/app/pricing/page.tsx
import Link from 'next/link'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white py-20 px-6">
      <h1 className="text-4xl font-bold text-center mb-4">요금제</h1>
      <p className="text-center text-gray-500 mb-12">지금 바로 무료로 시작하세요</p>

      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8">
        {/* 무료 */}
        <div className="border rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-1">무료</h2>
          <p className="text-3xl font-extrabold mb-6">$0<span className="text-base font-normal text-gray-400">/월</span></p>
          <ul className="text-sm text-gray-600 space-y-2 mb-8">
            {['일일 5회 분류', 'Top-1 결과', 'PWA 설치 + 오프라인'].map(f => (
              <li key={f} className="flex items-center gap-2">✅ {f}</li>
            ))}
            {['Top-5 결과', 'Grad-CAM 히트맵', 'TTA 앙상블', '분류 히스토리'].map(f => (
              <li key={f} className="flex items-center gap-2 text-gray-300">❌ {f}</li>
            ))}
          </ul>
          <Link href="/app" className="block text-center py-2.5 border border-gray-300 rounded-full hover:bg-gray-50">
            무료로 시작
          </Link>
        </div>

        {/* 프리미엄 */}
        <div className="border-2 border-brand rounded-2xl p-8 relative">
          <span className="absolute -top-3 left-6 bg-brand text-white text-xs px-3 py-1 rounded-full">추천</span>
          <h2 className="text-xl font-bold mb-1">프리미엄</h2>
          <p className="text-3xl font-extrabold mb-6">$5<span className="text-base font-normal text-gray-400">/월</span></p>
          <ul className="text-sm text-gray-600 space-y-2 mb-8">
            {['무제한 분류', 'Top-5 결과', 'Grad-CAM 히트맵', 'TTA 5-crop 앙상블', '불확실도 표시', '분류 히스토리', 'PWA 설치 + 오프라인'].map(f => (
              <li key={f} className="flex items-center gap-2">✅ {f}</li>
            ))}
          </ul>
          <a
            href="/api/polar/checkout"
            className="block text-center py-2.5 bg-brand text-white rounded-full hover:bg-brand-dark font-semibold"
          >
            업그레이드 →
          </a>
        </div>
      </div>
    </main>
  )
}
