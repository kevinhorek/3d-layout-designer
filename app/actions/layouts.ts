'use server'

import { createClient } from '@/lib/supabase/server'
import type { LayoutSnapshot } from '@/lib/db/types'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

function generateToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function createLayout(params: {
  name: string
  venueId: string
  locationId: string
  snapshot: LayoutSnapshot
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in', id: null }

  const { data, error } = await supabase
    .from('layouts')
    .insert({
      owner_id: user.id,
      name: params.name,
      venue_id: params.venueId,
      location_id: params.locationId,
      snapshot: params.snapshot as unknown as Record<string, unknown>,
    })
    .select('id')
    .single()

  if (error) return { error: error.message, id: null }
  revalidatePath('/')
  revalidatePath('/layouts')
  return { error: null, id: data.id }
}

export async function listMyLayouts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in', data: null }

  const { data, error } = await supabase
    .from('layouts')
    .select('id, name, venue_id, location_id, created_at, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message, data: null }
  return { error: null, data }
}

export async function getLayout(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in', data: null }

  const { data, error } = await supabase
    .from('layouts')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (error) return { error: error.message, data: null }
  return { error: null, data }
}

export async function updateLayout(id: string, snapshot: LayoutSnapshot) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const { error } = await supabase
    .from('layouts')
    .update({
      snapshot: snapshot as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/')
  revalidatePath('/layouts')
  revalidatePath(`/layout/${id}`)
  return { error: null }
}

export async function renameLayout(id: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name is required' }

  const { error } = await supabase
    .from('layouts')
    .update({
      name: trimmed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/')
  revalidatePath('/layouts')
  revalidatePath(`/layout/${id}`)
  return { error: null }
}

export async function duplicateLayout(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in', id: null }

  const { data: existing, error: fetchError } = await supabase
    .from('layouts')
    .select('name, venue_id, location_id, snapshot')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !existing) return { error: fetchError?.message ?? 'Layout not found', id: null }

  const { data: inserted, error: insertError } = await supabase
    .from('layouts')
    .insert({
      owner_id: user.id,
      name: `Copy of ${(existing.name as string) ?? 'Untitled'}`,
      venue_id: existing.venue_id,
      location_id: existing.location_id,
      snapshot: existing.snapshot,
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message, id: null }
  revalidatePath('/')
  revalidatePath('/layouts')
  return { error: null, id: inserted.id }
}

export async function deleteLayout(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const { error } = await supabase
    .from('layouts')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/')
  revalidatePath('/layouts')
  return { error: null }
}

export async function createShareLink(layoutId: string, role: 'view' | 'edit', expiresInDays: number | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in', token: null }

  const { data: layout } = await supabase
    .from('layouts')
    .select('id')
    .eq('id', layoutId)
    .eq('owner_id', user.id)
    .single()

  if (!layout) return { error: 'Layout not found', token: null }

  const token = generateToken()
  const expires_at = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { error } = await supabase.from('layout_shares').insert({
    layout_id: layoutId,
    token,
    role,
    expires_at,
  })

  if (error) return { error: error.message, token: null }
  revalidatePath('/')
  return { error: null, token }
}

export async function listShareLinks(layoutId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in', data: null }

  const { data: layout } = await supabase
    .from('layouts')
    .select('id')
    .eq('id', layoutId)
    .eq('owner_id', user.id)
    .single()
  if (!layout) return { error: 'Layout not found', data: null }

  const { data, error } = await supabase
    .from('layout_shares')
    .select('id, token, role, expires_at, created_at')
    .eq('layout_id', layoutId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: null }
  return { error: null, data: data ?? [] }
}

export async function revokeShareToken(layoutId: string, shareId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const { data: share } = await supabase
    .from('layout_shares')
    .select('id, layout_id')
    .eq('id', shareId)
    .single()
  if (!share) return { error: 'Share link not found' }

  const { data: layout } = await supabase
    .from('layouts')
    .select('id')
    .eq('id', share.layout_id)
    .eq('owner_id', user.id)
    .single()
  if (!layout) return { error: 'Not allowed' }

  const { error } = await supabase.from('layout_shares').delete().eq('id', shareId)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}

export async function getLayoutByShareToken(token: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_layout_by_share_token', {
    share_token: token,
  })
  if (error) return { error: error.message, data: null }
  if (data == null) return { error: 'Invalid or expired link', data: null }
  return { error: null, data: data as Record<string, unknown> }
}

export async function updateLayoutByShareToken(token: string, snapshot: LayoutSnapshot) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('update_layout_by_share_token', {
    share_token: token,
    new_snapshot: snapshot as unknown as Record<string, unknown>,
  })
  if (error) return { error: error.message }
  if (data == null) return { error: 'Invalid or expired link' }
  return { error: null }
}
