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
        <h1 className="text-2xl font-bold text-gray-900">AI 음식 분류기</h1>
        <p className="text-gray-500 text-sm mt-1">
          사진을 업로드하거나 카메라로 촬영하면 AI가 음식을 분류합니다.
          {!isPremium && ' (무료: 하루 5회)'}
        </p>
      </div>
      <ClassifierClient isPremium={isPremium} />
    </main>
  )
}
