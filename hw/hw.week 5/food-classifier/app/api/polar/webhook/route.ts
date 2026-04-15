// food-classifier/app/api/polar/webhook/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Polar.sh Standard Webhooks 서명 검증
function verifyPolarSignature(
  payload: string,
  headers: Headers,
  secret: string
): boolean {
  const msgId        = headers.get('webhook-id')
  const msgTimestamp = headers.get('webhook-timestamp')
  const msgSignature = headers.get('webhook-signature')

  if (!msgId || !msgTimestamp || !msgSignature) return false

  // 5분 이상 오래된 요청 거부
  const ts = parseInt(msgTimestamp, 10)
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) return false

  // secret 이 "whsec_..." 접두어를 포함하면 제거 후 base64 디코딩
  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const keyBytes  = Buffer.from(rawSecret, 'base64')

  const toSign   = `${msgId}.${msgTimestamp}.${payload}`
  const computed = `v1,${crypto.createHmac('sha256', keyBytes).update(toSign).digest('base64')}`

  // 헤더에 여러 서명이 공백으로 구분돼 있을 수 있음
  return msgSignature.split(' ').some((sig) => sig === computed)
}

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const payload = await req.text()

  if (!verifyPolarSignature(payload, req.headers, process.env.POLAR_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(payload)
  const type: string = event.type ?? ''

  // 구독 생성·갱신·취소 이벤트 처리
  const customerEmail: string | undefined =
    event.data?.customer?.email ??
    event.data?.subscription?.customer?.email

  if (!customerEmail) return NextResponse.json({ received: true })

  // 이메일로 Supabase 사용자 찾기
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
  const user = users.find((u) => u.email === customerEmail)
  if (!user) return NextResponse.json({ received: true })

  let newPlan: string | null = null

  if (type === 'subscription.created' || type === 'subscription.updated') {
    const status = event.data?.subscription?.status ?? event.data?.status
    newPlan = status === 'active' ? 'premium' : 'free'
  } else if (type === 'subscription.canceled' || type === 'subscription.revoked') {
    newPlan = 'free'
  } else if (type === 'order.created') {
    // 일회성 결제(비구독)일 경우에도 premium 처리
    newPlan = 'premium'
  }

  if (newPlan) {
    await supabaseAdmin
      .from('users')
      .update({ plan: newPlan })
      .eq('id', user.id)
  }

  return NextResponse.json({ received: true })
}
