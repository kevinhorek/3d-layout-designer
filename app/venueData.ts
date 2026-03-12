export interface VenueLocationLayoutItem {
  id: string
  type: 'table' | 'chair' | 'stage' | 'bar' | 'decoration'
  position: [number, number, number]
  rotation: number
  scale: number
}

export interface VenueLocation {
  id: string
  name: string
  panorama: string
  roomDimensions: { width: number; depth: number }
  layout: VenueLocationLayoutItem[]
}

export interface Venue {
  id: string
  name: string
  locations: VenueLocation[]
}

export const venues: Venue[] = [
  {
    id: 'grand-hall',
    name: 'Grand Hall',
    locations: [
      {
        id: 'main-ballroom',
        name: 'Main Ballroom',
        panorama: '/images/3d-layout-designer/panorama.jpg',
        roomDimensions: { width: 12, depth: 14 },
        layout: [
          { id: 'stage-1', type: 'stage', position: [0, 0, 5], rotation: 0, scale: 1 },
          { id: 'round-table-6-1', type: 'table', position: [-3, 0, -1], rotation: 0, scale: 1 },
          { id: 'round-table-6-2', type: 'table', position: [0, 0, -1], rotation: 0, scale: 1 },
          { id: 'round-table-6-3', type: 'table', position: [3, 0, -1], rotation: 0, scale: 1 },
          { id: 'round-table-6-4', type: 'table', position: [-3, 0, -3.5], rotation: 0, scale: 1 },
          { id: 'round-table-6-5', type: 'table', position: [0, 0, -3.5], rotation: 0, scale: 1 },
          { id: 'round-table-6-6', type: 'table', position: [3, 0, -3.5], rotation: 0, scale: 1 },
          { id: 'bar-1', type: 'bar', position: [-5, 0, -5], rotation: Math.PI / 2, scale: 1 },
          { id: 'bar-2', type: 'bar', position: [5, 0, -5], rotation: -Math.PI / 2, scale: 1 },
          { id: 'podium-1', type: 'decoration', position: [0, 0, 4.2], rotation: 0, scale: 1 },
        ],
      },
      {
        id: 'terrace',
        name: 'Terrace',
        panorama: '/images/3d-layout-designer/panorama.jpg',
        roomDimensions: { width: 8, depth: 10 },
        layout: [
          { id: 'high-top-table-1', type: 'table', position: [-2, 0, -1], rotation: 0, scale: 1 },
          { id: 'high-top-table-2', type: 'table', position: [2, 0, -1], rotation: 0, scale: 1 },
          { id: 'standing-table-1', type: 'table', position: [-2, 0, -3], rotation: 0, scale: 1 },
          { id: 'standing-table-2', type: 'table', position: [2, 0, -3], rotation: 0, scale: 1 },
          { id: 'lounge-1', type: 'decoration', position: [0, 0, -5], rotation: 0, scale: 1 },
          { id: 'plant-1', type: 'decoration', position: [-3.5, 0, 0], rotation: 0, scale: 1 },
          { id: 'plant-2', type: 'decoration', position: [3.5, 0, 0], rotation: 0, scale: 1 },
        ],
      },
      {
        id: 'empty-room',
        name: 'Empty Room',
        panorama: '/images/3d-layout-designer/panorama.jpg',
        roomDimensions: { width: 10, depth: 10 },
        layout: [],
      },
    ],
  },
  {
    id: 'conference-center',
    name: 'Conference Center',
    locations: [
      {
        id: 'keynote-room',
        name: 'Keynote Room',
        panorama: '/images/3d-layout-designer/panorama.jpg',
        roomDimensions: { width: 15, depth: 12 },
        layout: [
          { id: 'stage-large-1', type: 'stage', position: [0, 0, 4], rotation: 0, scale: 1 },
          { id: 'podium-1', type: 'decoration', position: [0, 0, 3.2], rotation: 0, scale: 1 },
          { id: 'rectangular-table-1', type: 'table', position: [-4, 0, -1], rotation: 0, scale: 1 },
          { id: 'rectangular-table-2', type: 'table', position: [0, 0, -1], rotation: 0, scale: 1 },
          { id: 'rectangular-table-3', type: 'table', position: [4, 0, -1], rotation: 0, scale: 1 },
          { id: 'rectangular-table-4', type: 'table', position: [-4, 0, -3.5], rotation: 0, scale: 1 },
          { id: 'rectangular-table-5', type: 'table', position: [0, 0, -3.5], rotation: 0, scale: 1 },
          { id: 'rectangular-table-6', type: 'table', position: [4, 0, -3.5], rotation: 0, scale: 1 },
        ],
      },
      {
        id: 'breakout-a',
        name: 'Breakout A',
        panorama: '/images/3d-layout-designer/panorama.jpg',
        roomDimensions: { width: 6, depth: 8 },
        layout: [
          { id: 'round-table-8-1', type: 'table', position: [0, 0, 0], rotation: 0, scale: 1 },
          { id: 'sofa-1', type: 'decoration', position: [-2, 0, -2.5], rotation: 0, scale: 1 },
          { id: 'sofa-2', type: 'decoration', position: [2, 0, -2.5], rotation: Math.PI, scale: 1 },
        ],
      },
      {
        id: 'breakout-b',
        name: 'Breakout B',
        panorama: '/images/3d-layout-designer/panorama.jpg',
        roomDimensions: { width: 6, depth: 6 },
        layout: [
          { id: 'round-table-6-1', type: 'table', position: [-1.5, 0, -1], rotation: 0, scale: 1 },
          { id: 'round-table-6-2', type: 'table', position: [1.5, 0, -1], rotation: 0, scale: 1 },
          { id: 'round-table-6-3', type: 'table', position: [-1.5, 0, -3], rotation: 0, scale: 1 },
          { id: 'round-table-6-4', type: 'table', position: [1.5, 0, -3], rotation: 0, scale: 1 },
        ],
      },
    ],
  },
  {
    id: 'rooftop-lounge',
    name: 'Rooftop Lounge',
    locations: [
      {
        id: 'main-deck',
        name: 'Main Deck',
        panorama: '/images/3d-layout-designer/panorama.jpg',
        roomDimensions: { width: 10, depth: 12 },
        layout: [
          { id: 'bar-1', type: 'bar', position: [0, 0, -5], rotation: 0, scale: 1 },
          { id: 'high-top-table-1', type: 'table', position: [-2.5, 0, -2], rotation: 0, scale: 1 },
          { id: 'high-top-table-2', type: 'table', position: [2.5, 0, -2], rotation: 0, scale: 1 },
          { id: 'lounge-1', type: 'decoration', position: [-3, 0, 1], rotation: Math.PI / 2, scale: 1 },
          { id: 'lounge-2', type: 'decoration', position: [3, 0, 1], rotation: -Math.PI / 2, scale: 1 },
          { id: 'plant-1', type: 'decoration', position: [-4, 0, -5.5], rotation: 0, scale: 1 },
          { id: 'plant-2', type: 'decoration', position: [4, 0, -5.5], rotation: 0, scale: 1 },
        ],
      },
    ],
  },
]

export function getDefaultVenue(): Venue {
  return venues[0]
}

export function getDefaultLocation(venue: Venue): VenueLocation {
  return venue.locations[0]
}

export function findVenueById(id: string): Venue | undefined {
  return venues.find((v) => v.id === id)
}

export function findLocationById(venue: Venue, locationId: string): VenueLocation | undefined {
  return venue.locations.find((l) => l.id === locationId)
}
