/**
 * Public origin for redirects (auth callback, logout) on Vercel, Cloud Run, and local dev.
 * Prefer NEXT_PUBLIC_SITE_URL in production so behavior matches across hosts.
 * Behind reverse proxies (e.g. Google Cloud Load Balancer), falls back to forwarded headers.
 */
export function getPublicOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0]?.trim()
    if (host) {
      const proto = forwardedProto.split(',')[0]?.trim() || 'https'
      return `${proto}://${host}`
    }
  }

  return new URL(request.url).origin
}
