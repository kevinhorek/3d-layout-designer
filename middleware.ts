import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Exclude health checks (no Supabase session; used by Cloud Run / probes)
    '/((?!_next/static|_next/image|favicon.ico|api/health|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
