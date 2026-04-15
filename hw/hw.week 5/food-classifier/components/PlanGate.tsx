// food-classifier/components/PlanGate.tsx
'use client'

import Link from 'next/link'

interface Props {
  isPremium: boolean
  featureName: string
  children: React.ReactNode
}

export default function PlanGate({ isPremium, featureName, children }: Props) {
  if (isPremium) return <>{children}</>

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="blur-sm pointer-events-none select-none opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 gap-2">
        <span className="text-2xl">🔒</span>
        <p className="text-sm font-medium text-gray-700">{featureName}</p>
        <Link
          href="/pricing"
          className="px-4 py-1.5 bg-brand text-white text-sm rounded-full hover:bg-brand-dark"
        >
          프리미엄 업그레이드
        </Link>
      </div>
    </div>
  )
}
