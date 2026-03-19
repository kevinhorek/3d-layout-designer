-- Allow listing and adding layout comments when user has edit access via share token (security definer)

create or replace function public.list_comments_by_share_token(share_token text)
returns setof public.layout_comments
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select c.id, c.layout_id, c.author_id, c.body, c.created_at
  from public.layout_comments c
  join public.layout_shares s on s.layout_id = c.layout_id
  where s.token = share_token
    and s.role = 'edit'
    and (s.expires_at is null or s.expires_at > now())
  order by c.created_at asc;
end;
$$;

create or replace function public.add_comment_by_share_token(share_token text, body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  layout_uuid uuid;
  comment_id uuid;
begin
  select s.layout_id into layout_uuid
  from layout_shares s
  where s.token = share_token and s.role = 'edit'
    and (s.expires_at is null or s.expires_at > now());
  if not found or layout_uuid is null then
    return null;
  end if;
  if trim(body) is null or length(trim(body)) = 0 then
    return null;
  end if;
  insert into layout_comments (layout_id, author_id, body)
  values (layout_uuid, auth.uid(), trim(body))
  returning id into comment_id;
  return comment_id;
end;
$$;

create or replace function public.delete_comment_by_share_token(share_token text, comment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  layout_uuid uuid;
begin
  select s.layout_id into layout_uuid
  from layout_shares s
  where s.token = share_token and s.role = 'edit'
    and (s.expires_at is null or s.expires_at > now());
  if not found then
    return false;
  end if;
  delete from layout_comments c
  where c.id = comment_id and c.layout_id = layout_uuid and c.author_id = auth.uid();
  return found;
end;
$$;

grant execute on function public.list_comments_by_share_token(text) to anon, authenticated;
grant execute on function public.add_comment_by_share_token(text, text) to authenticated;
grant execute on function public.delete_comment_by_share_token(text, uuid) to authenticated;
