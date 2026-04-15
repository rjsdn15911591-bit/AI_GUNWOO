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

  const checkout = await polar.checkouts.create({
    productId: process.env.POLAR_PRODUCT_ID!,
    customerEmail: user.email ?? undefined,
    successUrl: `${origin}/app`,
  })

  return NextResponse.redirect(checkout.url)
}
