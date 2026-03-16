-- Layouts: one per "plan", owned by a user
create table if not exists public.layouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled layout',
  venue_id text not null,
  location_id text not null,
  snapshot jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Version history: snapshots for each layout
create table if not exists public.layout_versions (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.layouts(id) on delete cascade,
  version_number int not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete set null
);

create index if not exists layout_versions_layout_id on public.layout_versions(layout_id);
create index if not exists layout_versions_created_at on public.layout_versions(layout_id, created_at desc);

-- Share links: token-based access for clients
create table if not exists public.layout_shares (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.layouts(id) on delete cascade,
  token text not null unique,
  role text not null check (role in ('view', 'edit')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists layout_shares_token on public.layout_shares(token);
create index if not exists layout_shares_layout_id on public.layout_shares(layout_id);

-- RLS
alter table public.layouts enable row level security;
alter table public.layout_versions enable row level security;
alter table public.layout_shares enable row level security;

-- Layouts: owner can do anything
create policy "Users can manage own layouts"
  on public.layouts for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Layout versions: anyone who can read the layout can read versions
create policy "Users can manage versions of own layouts"
  on public.layout_versions for all
  using (
    exists (
      select 1 from public.layouts l
      where l.id = layout_versions.layout_id and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.layouts l
      where l.id = layout_versions.layout_id and l.owner_id = auth.uid()
    )
  );

-- Shares: only layout owner can create/update/delete shares
create policy "Owners can manage shares"
  on public.layout_shares for all
  using (
    exists (
      select 1 from public.layouts l
      where l.id = layout_shares.layout_id and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.layouts l
      where l.id = layout_shares.layout_id and l.owner_id = auth.uid()
    )
  );

-- Get layout by share token (for client access via link). Returns layout row or null.
create or replace function public.get_layout_by_share_token(share_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select l.id, l.owner_id, l.name, l.venue_id, l.location_id, l.snapshot, l.updated_at, s.role
  into rec
  from layout_shares s
  join layouts l on l.id = s.layout_id
  where s.token = share_token
    and (s.expires_at is null or s.expires_at > now());
  if not found then
    return null;
  end if;
  return json_build_object(
    'id', rec.id,
    'owner_id', rec.owner_id,
    'name', rec.name,
    'venue_id', rec.venue_id,
    'location_id', rec.location_id,
    'snapshot', rec.snapshot,
    'updated_at', rec.updated_at,
    'share_role', rec.role
  );
end;
$$;

grant execute on function public.get_layout_by_share_token(text) to anon;
grant execute on function public.get_layout_by_share_token(text) to authenticated;

-- Update layout by share token (only if role is 'edit')
create or replace function public.update_layout_by_share_token(share_token text, new_snapshot jsonb)
returns uuid
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
    return null;
  end if;
  update layouts
  set snapshot = new_snapshot, updated_at = now()
  where id = layout_uuid;
  return layout_uuid;
end;
$$;

grant execute on function public.update_layout_by_share_token(text, jsonb) to anon;
grant execute on function public.update_layout_by_share_token(text, jsonb) to authenticated;
