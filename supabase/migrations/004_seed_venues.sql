-- Seed venues and locations (mirrors app/venueData.ts for when DB is used)
insert into public.venues (id, name) values
  ('grand-hall', 'Grand Hall'),
  ('conference-center', 'Conference Center'),
  ('rooftop-lounge', 'Rooftop Lounge')
on conflict (id) do nothing;

insert into public.venue_locations (id, venue_id, name, panorama, room_width, room_depth) values
  ('main-ballroom', 'grand-hall', 'Main Ballroom', '/images/3d-layout-designer/panorama.jpg', 12, 14),
  ('terrace', 'grand-hall', 'Terrace', '/images/3d-layout-designer/panorama.jpg', 8, 10),
  ('empty-room', 'grand-hall', 'Empty Room', '/images/3d-layout-designer/panorama.jpg', 10, 10),
  ('keynote-room', 'conference-center', 'Keynote Room', '/images/3d-layout-designer/panorama.jpg', 15, 12),
  ('breakout-a', 'conference-center', 'Breakout A', '/images/3d-layout-designer/panorama.jpg', 6, 8),
  ('breakout-b', 'conference-center', 'Breakout B', '/images/3d-layout-designer/panorama.jpg', 6, 6),
  ('main-deck', 'rooftop-lounge', 'Main Deck', '/images/3d-layout-designer/panorama.jpg', 10, 12)
on conflict (id) do nothing;
