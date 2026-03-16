'use server'

import { createClient } from '@/lib/supabase/server'
import type { LayoutSnapshot } from '@/lib/db/types'

export async function listTemplates() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const q = supabase
    .from('layout_templates')
    .select('id, name, venue_id, location_id, snapshot, owner_id, created_at')
    .order('created_at', { ascending: false })
  const { data, error } = user
    ? await q.or(`owner_id.is.null,owner_id.eq.${user.id}`)
    : await q.is('owner_id', null)

  if (error) return { error: error.message, data: null }
  return { error: null, data: data ?? [] }
}

export async function createTemplate(params: {
  name: string
  venueId: string
  locationId: string
  snapshot: LayoutSnapshot
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in', id: null }

  const { data, error } = await supabase
    .from('layout_templates')
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
  return { error: null, id: data.id }
}
