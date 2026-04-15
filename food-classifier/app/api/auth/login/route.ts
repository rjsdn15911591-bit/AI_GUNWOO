// food-classifier/app/api/auth/login/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const provider = (searchParams.get('provider') ?? 'google') as 'google' | 'github'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=oauth_failed`)
  }

  return NextResponse.redirect(data.url)
}
