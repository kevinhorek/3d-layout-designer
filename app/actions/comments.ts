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

export async function deleteComment(layoutId: string, commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }
  const { data: layout } = await supabase.from('layouts').select('id').eq('id', layoutId).eq('owner_id', user.id).single()
  if (!layout) return { error: 'Layout not found' }
  const { error } = await supabase.from('layout_comments').delete().eq('id', commentId).eq('layout_id', layoutId)
  if (error) return { error: error.message }
  return { error: null }
}

export async function listCommentsByShareToken(shareToken: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('list_comments_by_share_token', { share_token: shareToken })
  if (error) return { error: error.message, data: null }
  return { error: null, data: (data ?? []) as Array<{ id: string; body: string; author_id: string; created_at: string }> }
}

export async function addCommentByShareToken(shareToken: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to add a note' }
  const trimmed = body.trim()
  if (!trimmed) return { error: 'Note cannot be empty' }
  const { data: id, error } = await supabase.rpc('add_comment_by_share_token', { share_token: shareToken, body: trimmed })
  if (error) return { error: error.message }
  if (!id) return { error: 'Invalid or expired link' }
  return { error: null }
}

export async function deleteCommentByShareToken(shareToken: string, commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }
  const { data: ok, error } = await supabase.rpc('delete_comment_by_share_token', { share_token: shareToken, comment_id: commentId })
  if (error) return { error: error.message }
  if (!ok) return { error: 'Not allowed or not found' }
  return { error: null }
}
