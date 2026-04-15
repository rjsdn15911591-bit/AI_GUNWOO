// food-classifier/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Food Classifier',
  description: '사진 한 장으로 음식을 AI가 즉시 분류합니다.',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'FoodAI' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
