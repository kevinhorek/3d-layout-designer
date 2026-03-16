'use server'

import { createClient } from '@/lib/supabase/server'
import type { LayoutSnapshot } from '@/lib/db/types'
import { revalidatePath } from 'next/cache'

export async function saveVersion(layoutId: string, snapshot: LayoutSnapshot) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in', versionNumber: null }

  const { data: max } = await supabase
    .from('layout_versions')
    .select('version_number')
    .eq('layout_id', layoutId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const versionNumber = (max?.version_number ?? 0) + 1

  const { error } = await supabase.from('layout_versions').insert({
    layout_id: layoutId,
    version_number: versionNumber,
    snapshot: snapshot as unknown as Record<string, unknown>,
    created_by: user.id,
  })

  if (error) return { error: error.message, versionNumber: null }
  revalidatePath(`/layout/${layoutId}`)
  return { error: null, versionNumber }
}

export async function listVersions(layoutId: string) {
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
    .from('layout_versions')
    .select('id, version_number, created_at')
    .eq('layout_id', layoutId)
    .order('version_number', { ascending: false })
    .limit(50)

  if (error) return { error: error.message, data: null }
  return { error: null, data }
}

export async function getVersion(layoutId: string, versionId: string) {
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
    .from('layout_versions')
    .select('snapshot')
    .eq('id', versionId)
    .eq('layout_id', layoutId)
    .single()

  if (error) return { error: error.message, data: null }
  return { error: null, data: data?.snapshot as LayoutSnapshot }
}
