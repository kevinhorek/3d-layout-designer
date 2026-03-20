'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Client error:', error)
  }, [error])

  const isDev = typeof window !== 'undefined' && window.location?.hostname === 'localhost'

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f8f9fa',
        fontFamily: 'system-ui, sans-serif',
        color: '#1a1a1a',
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
        Something went wrong
      </h1>
      {isDev && error?.message && (
        <pre style={{ fontSize: 12, color: '#b91c1c', maxWidth: 480, overflow: 'auto', marginBottom: 16, padding: 12, background: '#fef2f2', borderRadius: 8 }}>
          {error.message}
        </pre>
      )}
      <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 420, textAlign: 'center', marginBottom: 20 }}>
        A client-side error occurred. This can be caused by a browser extension (e.g. Grammarly, NewsGuard) or by missing configuration. Try <strong>Incognito / Private window</strong> or disabling extensions. If the app was just deployed, ensure <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> were set at <strong>build time</strong> (e.g. in Cloud Build).
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
          background: '#003366',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
