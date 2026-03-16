'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const theme = {
  accent: '#003366',
  accentLight: '#FFC72C',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  border: 'rgba(0, 0, 0, 0.08)',
  radius: '12px',
}

function safeNext(next: string | null): string {
  if (!next || typeof next !== 'string') return '/'
  const path = next.startsWith('/') ? next : `/${next}`
  if (!path.startsWith('/')) return '/'
  try {
    new URL(path, window.location.origin)
    return path
  } catch {
    return '/'
  }
}

function LoginForm() {
  const searchParams = useSearchParams()
  const nextParam = searchParams.get('next')
  const redirectTo = useMemo(() => safeNext(nextParam), [nextParam])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const supabase = createClient()
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
        })
        if (error) throw error
        setMessage({ type: 'success', text: 'Check your email to confirm your account.' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Something went wrong',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: theme.radius,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: `1px solid ${theme.border}`,
          padding: '24px 20px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="/images/coe-logo.svg"
            alt="City of Edmonton"
            style={{ height: 40, width: 'auto', marginBottom: 8 }}
          />
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.text }}>
            3D Layout Designer
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: theme.textSecondary }}>
            {isSignUp ? 'Create an account' : 'Sign in to save and share layouts'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 4 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              fontSize: 14,
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 4 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={6}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              fontSize: 14,
              marginBottom: 20,
              boxSizing: 'border-box',
            }}
          />
          {message && (
            <p
              style={{
                marginBottom: 16,
                padding: 10,
                borderRadius: 8,
                fontSize: 13,
                background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                color: message.type === 'error' ? '#b91c1c' : '#15803d',
              }}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: theme.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Please wait…' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        {!showForgotPassword ? (
          <button
            type="button"
            onClick={() => { setIsSignUp((v) => !v); setMessage(null); setResetSent(false) }}
            style={{
              marginTop: 16,
              width: '100%',
              padding: 8,
              background: 'transparent',
              border: 'none',
              color: theme.textSecondary,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        ) : null}

        {!showForgotPassword ? (
          <button
            type="button"
            onClick={() => { setShowForgotPassword(true); setMessage(null); setResetSent(false) }}
            style={{
              marginTop: 8,
              width: '100%',
              padding: 8,
              background: 'transparent',
              border: 'none',
              color: theme.accent,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Forgot password?
          </button>
        ) : (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
            {resetSent ? (
              <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>
                Check your email for a link to reset your password.
              </p>
            ) : (
              <>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 4 }}>
                  Email for password reset
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    marginBottom: 8,
                    boxSizing: 'border-box',
                  }}
                />
                {message && (
                  <p
                    style={{
                      marginBottom: 8,
                      padding: 10,
                      borderRadius: 8,
                      fontSize: 13,
                      background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                      color: message.type === 'error' ? '#b91c1c' : '#15803d',
                    }}
                  >
                    {message.text}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true)
                      setMessage(null)
                      const supabase = createClient()
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/auth/callback?next=/`,
                      })
                      setLoading(false)
                      if (error) setMessage({ type: 'error', text: error.message })
                      else setResetSent(true)
                    }}
                    style={{
                      padding: '10px 16px',
                      background: theme.accent,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: loading ? 'wait' : 'pointer',
                    }}
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setMessage(null) }}
                    style={{
                      padding: '10px 16px',
                      background: 'transparent',
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: 'pointer',
                      color: theme.textSecondary,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setResetSent(false); setMessage(null) }}
              style={{
                marginTop: 8,
                padding: 4,
                background: 'transparent',
                border: 'none',
                color: theme.textSecondary,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ← Back to sign in
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}><p style={{ color: theme.textSecondary }}>Loading…</p></div>}>
      <LoginForm />
    </React.Suspense>
  )
}
