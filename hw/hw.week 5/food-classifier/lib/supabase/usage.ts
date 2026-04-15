// food-classifier/lib/supabase/usage.ts
import { createClient } from './client'
import type { FoodResult } from '@/lib/ml/foodLabels'

const FREE_DAILY_LIMIT = 5

export async function checkAndIncrementUsage(): Promise<{
  allowed: boolean
  remaining: number
  plan: string
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, remaining: 0, plan: 'free' }

  const { data, error } = await supabase
    .from('users')
    .select('plan, daily_count, reset_at')
    .eq('id', user.id)
    .single()

  if (error || !data) return { allowed: false, remaining: 0, plan: 'free' }

  const { plan, daily_count, reset_at } = data
  if (plan === 'premium') return { allowed: true, remaining: Infinity, plan }

  const resetDate = new Date(reset_at)
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let count = daily_count
  if (resetDate < todayMidnight) {
    await supabase
      .from('users')
      .update({ daily_count: 0, reset_at: now.toISOString() })
      .eq('id', user.id)
    count = 0
  }

  if (count >= FREE_DAILY_LIMIT) {
    return { allowed: false, remaining: 0, plan }
  }

  await supabase
    .from('users')
    .update({ daily_count: count + 1 })
    .eq('id', user.id)

  return { allowed: true, remaining: FREE_DAILY_LIMIT - count - 1, plan }
}

export async function saveClassification(params: {
  imageUrl: string | null
  top1Label: string
  top1Conf: number
  results: FoodResult[]
  sigma: number
  backend: string
}): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('classifications').insert({
    user_id:    user.id,
    image_url:  params.imageUrl,
    top1_label: params.top1Label,
    top1_conf:  params.top1Conf,
    results:    params.results,
    sigma:      params.sigma,
    backend:    params.backend,
  })
}
