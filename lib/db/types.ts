export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface LayoutSnapshot {
  furniture: Array<{
    id: string
    type: string
    position: [number, number, number]
    rotation: number
    scale: number
  }>
  floorLevelY: number
  venueId: string
  locationId: string
  guests?: string[]
  guestAssignments?: Record<string, string[]>
  itemColors?: Record<string, string>
  customModels?: Array<{
    id: string
    url: string
    position: [number, number, number]
    rotation: number
    scale: number
  }>
  panoramaUrl?: string
}

export interface DbLayout {
  id: string
  owner_id: string
  name: string
  venue_id: string
  location_id: string
  snapshot: LayoutSnapshot
  created_at: string
  updated_at: string
}

export interface DbLayoutVersion {
  id: string
  layout_id: string
  version_number: number
  snapshot: LayoutSnapshot
  created_at: string
  created_by: string
}

export interface DbLayoutShare {
  id: string
  layout_id: string
  token: string
  role: 'view' | 'edit'
  expires_at: string | null
  created_at: string
}
