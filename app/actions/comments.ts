'use server'

import { createClient } from '@/lib/supabase/server'

export async function listComments(layoutId: string) {
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
    .from('layout_comments')
    .select('id, body, author_id, created_at')
    .eq('layout_id', layoutId)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message, data: null }
  return { error: null, data: data ?? [] }
}

export async function addComment(layoutId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Comment cannot be empty' }

  const { data: layout } = await supabase
    .from('layouts')
    .select('id')
    .eq('id', layoutId)
    .eq('owner_id', user.id)
    .single()
  if (!layout) return { error: 'Layout not found' }

  const { error } = await supabase
    .from('layout_comments')
    .insert({
      layout_id: layoutId,
      author_id: user.id,
      body: trimmed,
    })

  if (error) return { error: error.message }
  return { error: null }
}
