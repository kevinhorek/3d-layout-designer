import { createClient } from '@/lib/supabase/server'
import { getPublicOrigin } from '@/lib/requestOrigin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const origin = getPublicOrigin(request)
  return NextResponse.redirect(new URL('/', origin), 302)
}
