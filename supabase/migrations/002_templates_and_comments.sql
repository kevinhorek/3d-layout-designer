-- Layout templates: reusable starting points (owner_id null = system, else user's template)
create table if not exists public.layout_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  venue_id text not null,
  location_id text not null,
  snapshot jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists layout_templates_owner on public.layout_templates(owner_id);

alter table public.layout_templates enable row level security;

create policy "Anyone can read layout_templates"
  on public.layout_templates for select
  using (true);

create policy "Users can insert own layout_templates"
  on public.layout_templates for insert
  with check (auth.uid() = owner_id or owner_id is null);

create policy "Users can update/delete own layout_templates"
  on public.layout_templates for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Layout comments (notes on a layout)
create table if not exists public.layout_comments (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.layouts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists layout_comments_layout on public.layout_comments(layout_id);

alter table public.layout_comments enable row level security;

create policy "Layout owner can manage comments"
  on public.layout_comments for all
  using (
    exists (select 1 from public.layouts l where l.id = layout_comments.layout_id and l.owner_id = auth.uid())
  )
  with check (
    auth.uid() = author_id
    and exists (select 1 from public.layouts l where l.id = layout_comments.layout_id and l.owner_id = auth.uid())
  );
