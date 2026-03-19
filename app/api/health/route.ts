import { NextResponse } from 'next/server'

/**
 * Liveness/readiness for Cloud Run, GKE, and load balancers.
 * No Supabase or cookies — keep middleware from requiring auth here.
 */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: '3d-layout-designer' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  )
}
