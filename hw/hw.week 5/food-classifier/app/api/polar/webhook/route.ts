// food-classifier/app/api/polar/webhook/route.ts
import { createClient } from '@supabase/supabase-js'
import { verifyPolarWebhook } from '@/lib/polar'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const payload = await req.text()
  const signature = req.headers.get('webhook-signature') ?? ''

  if (!verifyPolarWebhook(payload, signature, process.env.POLAR_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(payload)

  const customerEmail: string | undefined =
    event.data?.customer?.email ?? event.data?.subscription?.customer?.email

  if (!customerEmail) {
    return NextResponse.json({ received: true })
  }

  // Find user by email via admin API
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
  const user = users.find((u) => u.email === customerEmail)
  if (!user) return NextResponse.json({ received: true })

  let newPlan = 'free'
  if (
    event.type === 'subscription.created' ||
    event.type === 'subscription.updated'
  ) {
    newPlan = event.data?.subscription?.status === 'active' ? 'premium' : 'free'
  }

  await supabaseAdmin
    .from('users')
    .update({ plan: newPlan })
    .eq('id', user.id)

  return NextResponse.json({ received: true })
}
