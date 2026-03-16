-- Venues and locations (replaces static venueData for admin-managed spaces)
create table if not exists public.venues (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.venue_locations (
  id text primary key,
  venue_id text not null references public.venues(id) on delete cascade,
  name text not null,
  panorama text not null default '/images/3d-layout-designer/panorama.jpg',
  room_width numeric not null default 10,
  room_depth numeric not null default 10,
  created_at timestamptz not null default now()
);

create index if not exists venue_locations_venue on public.venue_locations(venue_id);

alter table public.venues enable row level security;
alter table public.venue_locations enable row level security;

-- Allow all authenticated users to read venues/locations (city staff)
create policy "Authenticated can read venues"
  on public.venues for select
  to authenticated
  using (true);

create policy "Authenticated can read venue_locations"
  on public.venue_locations for select
  to authenticated
  using (true);

create policy "Authenticated can manage venues"
  on public.venues for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can manage venue_locations"
  on public.venue_locations for all
  to authenticated
  using (true)
  with check (true);