// food-classifier/app/api/polar/checkout/route.ts
import { Polar } from '@polar-sh/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const origin = new URL(req.url).origin

  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
  })

  let checkoutUrl: string

  try {
    const checkout = await polar.checkouts.create({
      productId: process.env.POLAR_PRODUCT_ID!,
      customerEmail: user.email ?? undefined,
      successUrl: `${origin}/app`,
    })
    checkoutUrl = checkout.url
  } catch (err: unknown) {
    // SDK v0.30.x 응답 파싱 버그 우회 — 실제 checkout은 성공했으므로 rawValue에서 URL 추출
    const raw = (err as { rawValue?: { url?: string } })?.rawValue
    if (raw?.url) {
      checkoutUrl = raw.url
    } else {
      throw err
    }
  }

  return NextResponse.redirect(checkoutUrl)
}
