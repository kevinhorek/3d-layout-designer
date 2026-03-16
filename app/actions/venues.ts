'use server'

import { createClient } from '@/lib/supabase/server'
import type { Venue, VenueLocation } from '@/app/venueData'

export async function getVenuesWithLocations(): Promise<{ error: string | null; data: Venue[] | null }> {
  const supabase = await createClient()
  const { data: venuesRows, error: venuesError } = await supabase
    .from('venues')
    .select('id, name')
    .order('name')
  if (venuesError) return { error: venuesError.message, data: null }

  const { data: locationsRows, error: locError } = await supabase
    .from('venue_locations')
    .select('id, venue_id, name, panorama, room_width, room_depth')
    .order('name')
  if (locError) return { error: locError.message, data: null }

  const locationsByVenue = (locationsRows ?? []).reduce<Record<string, VenueLocation[]>>((acc, row) => {
    const loc: VenueLocation = {
      id: row.id,
      name: row.name,
      panorama: row.panorama ?? '/images/3d-layout-designer/panorama.jpg',
      roomDimensions: { width: Number(row.room_width ?? 10), depth: Number(row.room_depth ?? 10) },
      layout: [],
    }
    if (!acc[row.venue_id]) acc[row.venue_id] = []
    acc[row.venue_id].push(loc)
    return acc
  }, {})

  const data: Venue[] = (venuesRows ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    locations: locationsByVenue[v.id] ?? [],
  })).filter((v) => v.locations.length > 0)

  return { error: null, data }
}
