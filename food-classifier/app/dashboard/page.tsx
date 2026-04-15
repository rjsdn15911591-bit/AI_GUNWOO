// food-classifier/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: userData } = await supabase
    .from('users').select('plan').eq('id', user.id).single()

  if (userData?.plan !== 'premium') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-4">히스토리는 프리미엄 기능입니다</p>
          <Link href="/pricing" className="px-6 py-2 bg-brand text-white rounded-full">
            업그레이드
          </Link>
        </div>
      </main>
    )
  }

  const { data: history } = await supabase
    .from('classifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">분류 히스토리</h1>
      {!history?.length ? (
        <p className="text-gray-400">아직 분류 기록이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((item) => (
            <div key={item.id}
              className="flex items-center justify-between p-4 bg-white border rounded-xl">
              <div>
                <p className="font-medium">{item.top1_label}</p>
                <p className="text-sm text-gray-400">
                  신뢰도 {(item.top1_conf * 100).toFixed(1)}%
                  · {new Date(item.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
