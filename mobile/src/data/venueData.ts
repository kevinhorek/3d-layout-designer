export interface FurnitureItem {
  id: string
  type: 'table' | 'chair' | 'stage' | 'bar' | 'decoration'
  position: [number, number, number]
  rotation: number
  scale: number
}

export type FurnitureShape =
  | 'round-table'
  | 'rectangular-table'
  | 'chair'
  | 'stage'
  | 'bar'
  | 'sofa'
  | 'high-top'
  | 'podium'
  | 'plant'
  | 'lounge'
  | 'bar-stool'
  | 'standing-table'

export interface FurnitureTemplate {
  id: string
  name: string
  type: FurnitureItem['type']
  shape: FurnitureShape
  icon: string
  dimensions: { width: number; depth: number; height: number }
}

export const furnitureTemplates: FurnitureTemplate[] = [
  { id: 'round-table-6', name: 'Round Table (6)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 1.5, depth: 1.5, height: 0.75 } },
  { id: 'round-table-8', name: 'Round Table (8)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 1.8, depth: 1.8, height: 0.75 } },
  { id: 'round-table-10', name: 'Round Table (10)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 2.2, depth: 2.2, height: 0.75 } },
  { id: 'rectangular-table', name: 'Rect. Table', type: 'table', shape: 'rectangular-table', icon: '🪑', dimensions: { width: 2.0, depth: 1.0, height: 0.75 } },
  { id: 'high-top-table', name: 'High-top Table', type: 'table', shape: 'high-top', icon: '🪑', dimensions: { width: 0.9, depth: 0.9, height: 1.1 } },
  { id: 'standing-table', name: 'Standing Table', type: 'table', shape: 'standing-table', icon: '🪑', dimensions: { width: 0.5, depth: 0.5, height: 1.0 } },
  { id: 'chair', name: 'Chair', type: 'chair', shape: 'chair', icon: '🪑', dimensions: { width: 0.5, depth: 0.5, height: 0.9 } },
  { id: 'bar-stool', name: 'Bar Stool', type: 'chair', shape: 'bar-stool', icon: '🪑', dimensions: { width: 0.4, depth: 0.4, height: 1.1 } },
  { id: 'sofa', name: 'Sofa', type: 'decoration', shape: 'sofa', icon: '🛋️', dimensions: { width: 2.0, depth: 0.9, height: 0.85 } },
  { id: 'lounge', name: 'Lounge Bench', type: 'decoration', shape: 'lounge', icon: '🛋️', dimensions: { width: 1.5, depth: 0.7, height: 0.5 } },
  { id: 'stage', name: 'Stage', type: 'stage', shape: 'stage', icon: '🎭', dimensions: { width: 3.0, depth: 2.0, height: 0.35 } },
  { id: 'stage-large', name: 'Stage (Large)', type: 'stage', shape: 'stage', icon: '🎭', dimensions: { width: 5.0, depth: 3.0, height: 0.4 } },
  { id: 'bar', name: 'Bar Counter', type: 'bar', shape: 'bar', icon: '🍸', dimensions: { width: 3.0, depth: 0.8, height: 1.1 } },
  { id: 'bar-short', name: 'Bar (Short)', type: 'bar', shape: 'bar', icon: '🍸', dimensions: { width: 1.8, depth: 0.7, height: 1.1 } },
  { id: 'podium', name: 'Podium', type: 'decoration', shape: 'podium', icon: '🎤', dimensions: { width: 0.6, depth: 0.5, height: 1.0 } },
  { id: 'plant', name: 'Plant', type: 'decoration', shape: 'plant', icon: '🪴', dimensions: { width: 0.4, depth: 0.4, height: 1.0 } },
  { id: 'plant-small', name: 'Plant (Small)', type: 'decoration', shape: 'plant', icon: '🪴', dimensions: { width: 0.3, depth: 0.3, height: 0.6 } },
]

export interface VenueLocation {
  id: string
  name: string
  roomDimensions: { width: number; depth: number }
  layout: FurnitureItem[]
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
        id: 'main-ballroom', name: 'Main Ballroom',
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
        id: 'terrace', name: 'Terrace',
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
      { id: 'empty-room', name: 'Empty Room', roomDimensions: { width: 10, depth: 10 }, layout: [] },
    ],
  },
  {
    id: 'conference-center',
    name: 'Conference Center',
    locations: [
      {
        id: 'keynote-room', name: 'Keynote Room',
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
        id: 'breakout-a', name: 'Breakout A',
        roomDimensions: { width: 6, depth: 8 },
        layout: [
          { id: 'round-table-8-1', type: 'table', position: [0, 0, 0], rotation: 0, scale: 1 },
          { id: 'sofa-1', type: 'decoration', position: [-2, 0, -2.5], rotation: 0, scale: 1 },
          { id: 'sofa-2', type: 'decoration', position: [2, 0, -2.5], rotation: Math.PI, scale: 1 },
        ],
      },
    ],
  },
  {
    id: 'rooftop-lounge',
    name: 'Rooftop Lounge',
    locations: [
      {
        id: 'main-deck', name: 'Main Deck',
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

export function getDefaultVenue(): Venue { return venues[0] }
export function getDefaultLocation(venue: Venue): VenueLocation { return venue.locations[0] }
export function findVenueById(id: string): Venue | undefined { return venues.find(v => v.id === id) }
export function findLocationById(venue: Venue, locationId: string): VenueLocation | undefined { return venue.locations.find(l => l.id === locationId) }

export function findTemplate(itemId: string): FurnitureTemplate | undefined {
  return furnitureTemplates.find(t => itemId.startsWith(t.id + '-'))
}
