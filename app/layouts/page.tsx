'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listMyLayouts, deleteLayout, duplicateLayout, renameLayout } from '@/app/actions/layouts'
import { getVenuesWithLocations } from '@/app/actions/venues'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const theme = {
  accent: '#003366',
  accentLight: '#FFC72C',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  border: 'rgba(0, 0, 0, 0.08)',
  radius: '12px',
}

type LayoutRow = { id: string; name: string; venue_id: string; location_id: string; updated_at: string }

export default function MyLayoutsPage() {
  const [layouts, setLayouts] = useState<LayoutRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [venueLocationNames, setVenueLocationNames] = useState<{ venue: Record<string, string>; location: Record<string, string> }>({ venue: {}, location: {} })
  const router = useRouter()

  useEffect(() => {
    getVenuesWithLocations().then(({ data }) => {
      if (!data) return
      const venue: Record<string, string> = {}
      const location: Record<string, string> = {}
      data.forEach((v) => {
        venue[v.id] = v.name
        v.locations.forEach((loc) => { location[loc.id] = loc.name })
      })
      setVenueLocationNames({ venue, location })
    })
  }, [])

  const filteredLayouts = useMemo(() => {
    if (!layouts) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return layouts
    const v = venueLocationNames.venue
    const loc = venueLocationNames.location
    return layouts.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (v[l.venue_id] ?? l.venue_id).toLowerCase().includes(q) ||
        (loc[l.location_id] ?? l.location_id).toLowerCase().includes(q)
    )
  }, [layouts, searchQuery, venueLocationNames])

  const refreshLayouts = () => {
    listMyLayouts().then(({ error, data }) => {
      if (!error && data) setLayouts(data)
    })
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      if (!user) {
        setLoading(false)
        return
      }
      listMyLayouts().then(({ error, data }) => {
        if (error) {
          setLayouts([])
        } else {
          setLayouts(data ?? [])
        }
        setLoading(false)
      })
    })
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
        <p style={{ color: theme.textSecondary }}>Loading…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16, color: theme.text }}>Sign in to see your saved layouts.</p>
          <Link
            href="/auth/login"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: theme.accent,
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Sign in
          </Link>
          <p style={{ marginTop: 16 }}>
            <Link href="/" style={{ fontSize: 13, color: theme.accent }}>← Back to app</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f8f9fa', padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/images/coe-logo.svg" alt="COE" style={{ height: 36, width: 'auto' }} />
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme.text }}>My layouts</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: theme.textSecondary }}>{user.email}</span>
            <Link
              href="/?new=1"
              style={{
                padding: '8px 16px',
                background: theme.accent,
                color: '#fff',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              New layout
            </Link>
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/')
                router.refresh()
              }}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: theme.textSecondary,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {layouts && layouts.length === 0 ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.9)',
              borderRadius: theme.radius,
              padding: 48,
              textAlign: 'center',
              border: `1px solid ${theme.border}`,
            }}
          >
            <p style={{ color: theme.textSecondary, marginBottom: 16 }}>No saved layouts yet.</p>
            <Link
              href="/?new=1"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: theme.accentLight,
                color: theme.accent,
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Create your first layout
            </Link>
          </div>
        ) : (
          <>
            {layouts && layouts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <input
                  type="search"
                  placeholder="Search by name or venue…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredLayouts.map((l) => (
              <li
                key={l.id}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: theme.radius,
                  border: `1px solid ${theme.border}`,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 0,
                }}
              >
                <Link
                  href={`/?layoutId=${l.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    textDecoration: 'none',
                    color: theme.text,
                    minWidth: 0,
                  }}
                >
                  {renamingId === l.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameLayout(l.id, renameValue).then(({ error }) => {
                            if (!error) {
                              refreshLayouts()
                              setRenamingId(null)
                            }
                          })
                        }
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      onBlur={() => {
                        if (renameValue.trim()) {
                          renameLayout(l.id, renameValue).then(({ error }) => {
                            if (!error) refreshLayouts()
                            setRenamingId(null)
                          })
                        } else setRenamingId(null)
                      }}
                      autoFocus
                      onClick={(e) => e.preventDefault()}
                      style={{ width: '100%', padding: '4px 8px', fontSize: 15, fontWeight: 600, border: `1px solid ${theme.border}`, borderRadius: 6, boxSizing: 'border-box' }}
                    />
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{l.name}</div>
                      <div style={{ fontSize: 12, color: theme.textSecondary }}>
                        {venueLocationNames.venue[l.venue_id] ?? l.venue_id} / {venueLocationNames.location[l.location_id] ?? l.location_id} · Updated {new Date(l.updated_at).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 4, borderLeft: `1px solid ${theme.border}` }}>
                  {deletingId === l.id ? (
                    <>
                      <span style={{ fontSize: 12, color: theme.textSecondary, marginRight: 4 }}>Delete?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const { error } = await deleteLayout(l.id)
                          if (!error) {
                            setLayouts((prev) => prev?.filter((x) => x.id !== l.id) ?? null)
                            setDeletingId(null)
                          }
                        }}
                        style={{ padding: '4px 10px', fontSize: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        style={{ padding: '4px 10px', fontSize: 12, background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', color: theme.textSecondary }}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault()
                          setDuplicatingId(l.id)
                          const { error, id } = await duplicateLayout(l.id)
                          setDuplicatingId(null)
                          if (!error && id) {
                            refreshLayouts()
                            router.push(`/?layoutId=${id}`)
                          }
                        }}
                        disabled={duplicatingId !== null}
                        style={{ padding: '6px 10px', fontSize: 12, background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, cursor: duplicatingId ? 'wait' : 'pointer', color: theme.textSecondary }}
                        title="Duplicate"
                      >
                        {duplicatingId === l.id ? '…' : 'Duplicate'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setRenamingId(l.id)
                          setRenameValue(l.name)
                        }}
                        style={{ padding: '6px 10px', fontSize: 12, background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', color: theme.textSecondary }}
                        title="Rename"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setDeletingId(l.id)
                        }}
                        style={{ padding: '6px 10px', fontSize: 12, background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', color: '#b91c1c' }}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
            {searchQuery.trim() && filteredLayouts.length === 0 && (
              <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 12 }}>No layouts match your search.</p>
            )}
          </>
        )}

        <p style={{ marginTop: 24 }}>
          <Link href="/" style={{ fontSize: 13, color: theme.accent }}>← Back to app</Link>
        </p>
      </div>
    </div>
  )
}
