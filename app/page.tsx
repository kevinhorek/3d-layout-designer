'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { venues, getDefaultVenue, getDefaultLocation, findVenueById, findLocationById, type Venue, type VenueLocation } from './venueData'

const DynamicCanvas = dynamic(
  () => import('./Scene3D').then(mod => mod.Scene3DCanvas || mod.default),
  {
    ssr: false,
    loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003366', backgroundColor: '#f5f5f5', fontWeight: 600 }}>Loading 3D viewer...</div>
  }
)

const theme = {
  bg: '#f8f9fa',
  surface: 'rgba(255, 255, 255, 0.85)',
  surfaceSolid: '#ffffff',
  border: 'rgba(0, 0, 0, 0.08)',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  accent: '#003366',
  accentLight: '#FFC72C',
  danger: '#ef4444',
  success: '#22c55e',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
  blur: 'blur(12px)',
}

interface FurnitureItem {
  id: string
  type: 'table' | 'chair' | 'stage' | 'bar' | 'decoration'
  position: [number, number, number]
  rotation: number
  scale: number
}

type FurnitureShape =
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

interface FurnitureTemplate {
  id: string
  name: string
  type: FurnitureItem['type']
  shape: FurnitureShape
  icon: string
  dimensions: { width: number; depth: number; height: number }
  seats: number
  cost: number
  previewImage?: string
}

const furnitureTemplates: FurnitureTemplate[] = [
  { id: 'round-table-6', name: 'Round Table (6)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 1.5, depth: 1.5, height: 0.75 }, seats: 6, cost: 85 },
  { id: 'round-table-8', name: 'Round Table (8)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 1.8, depth: 1.8, height: 0.75 }, seats: 8, cost: 95 },
  { id: 'round-table-10', name: 'Round Table (10)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 2.2, depth: 2.2, height: 0.75 }, seats: 10, cost: 120 },
  { id: 'rectangular-table', name: 'Rectangular Table', type: 'table', shape: 'rectangular-table', icon: '🪑', dimensions: { width: 2.0, depth: 1.0, height: 0.75 }, seats: 8, cost: 75 },
  { id: 'high-top-table', name: 'High-top Table', type: 'table', shape: 'high-top', icon: '🪑', dimensions: { width: 0.9, depth: 0.9, height: 1.1 }, seats: 4, cost: 45 },
  { id: 'standing-table', name: 'Standing Table', type: 'table', shape: 'standing-table', icon: '🪑', dimensions: { width: 0.5, depth: 0.5, height: 1.0 }, seats: 0, cost: 30 },
  { id: 'chair', name: 'Chair', type: 'chair', shape: 'chair', icon: '🪑', dimensions: { width: 0.5, depth: 0.5, height: 0.9 }, seats: 1, cost: 8 },
  { id: 'bar-stool', name: 'Bar Stool', type: 'chair', shape: 'bar-stool', icon: '🪑', dimensions: { width: 0.4, depth: 0.4, height: 1.1 }, seats: 1, cost: 12 },
  { id: 'sofa', name: 'Sofa', type: 'decoration', shape: 'sofa', icon: '🛋️', dimensions: { width: 2.0, depth: 0.9, height: 0.85 }, seats: 3, cost: 150 },
  { id: 'lounge', name: 'Lounge Bench', type: 'decoration', shape: 'lounge', icon: '🛋️', dimensions: { width: 1.5, depth: 0.7, height: 0.5 }, seats: 2, cost: 110 },
  { id: 'stage', name: 'Stage', type: 'stage', shape: 'stage', icon: '🎭', dimensions: { width: 3.0, depth: 2.0, height: 0.35 }, seats: 0, cost: 250 },
  { id: 'stage-large', name: 'Stage (Large)', type: 'stage', shape: 'stage', icon: '🎭', dimensions: { width: 5.0, depth: 3.0, height: 0.4 }, seats: 0, cost: 450 },
  { id: 'bar', name: 'Bar Counter', type: 'bar', shape: 'bar', icon: '🍸', dimensions: { width: 3.0, depth: 0.8, height: 1.1 }, seats: 0, cost: 200 },
  { id: 'bar-short', name: 'Bar (Short)', type: 'bar', shape: 'bar', icon: '🍸', dimensions: { width: 1.8, depth: 0.7, height: 1.1 }, seats: 0, cost: 140 },
  { id: 'podium', name: 'Podium', type: 'decoration', shape: 'podium', icon: '🎤', dimensions: { width: 0.6, depth: 0.5, height: 1.0 }, seats: 0, cost: 65 },
  { id: 'plant', name: 'Plant', type: 'decoration', shape: 'plant', icon: '🪴', dimensions: { width: 0.4, depth: 0.4, height: 1.0 }, seats: 0, cost: 25 },
  { id: 'plant-small', name: 'Plant (Small)', type: 'decoration', shape: 'plant', icon: '🪴', dimensions: { width: 0.3, depth: 0.3, height: 0.6 }, seats: 0, cost: 15 },
]

interface LayoutTemplate {
  id: string
  name: string
  description: string
  items: Array<{ templateId: string; position: [number, number, number]; rotation: number }>
}

const layoutTemplatePatterns: LayoutTemplate[] = [
  {
    id: 'banquet',
    name: 'Banquet',
    description: 'Round tables with seating for formal dining',
    items: [
      { templateId: 'round-table-8', position: [-3, 0, -2], rotation: 0 },
      { templateId: 'round-table-8', position: [0, 0, -2], rotation: 0 },
      { templateId: 'round-table-8', position: [3, 0, -2], rotation: 0 },
      { templateId: 'round-table-8', position: [-3, 0, 1], rotation: 0 },
      { templateId: 'round-table-8', position: [0, 0, 1], rotation: 0 },
      { templateId: 'round-table-8', position: [3, 0, 1], rotation: 0 },
      { templateId: 'stage', position: [0, 0, 4], rotation: 0 },
      { templateId: 'podium', position: [0, 0, 3.2], rotation: 0 },
    ]
  },
  {
    id: 'theatre',
    name: 'Theatre',
    description: 'Rows of chairs facing a stage',
    items: [
      { templateId: 'stage', position: [0, 0, 4], rotation: 0 },
      { templateId: 'podium', position: [0, 0, 3.2], rotation: 0 },
      ...Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 6 }, (_, col) => ({
          templateId: 'chair',
          position: [-2.5 + col * 1.0, 0, -row * 1.0] as [number, number, number],
          rotation: 0
        }))
      ).flat()
    ]
  },
  {
    id: 'classroom',
    name: 'Classroom',
    description: 'Rectangular tables with chairs in rows',
    items: [
      { templateId: 'podium', position: [0, 0, 4], rotation: 0 },
      ...Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 3 }, (_, col) => ({
          templateId: 'rectangular-table',
          position: [-3 + col * 3, 0, -row * 2] as [number, number, number],
          rotation: 0
        }))
      ).flat()
    ]
  },
  {
    id: 'cocktail',
    name: 'Cocktail',
    description: 'Standing tables and bar for networking events',
    items: [
      { templateId: 'bar', position: [0, 0, -4], rotation: 0 },
      { templateId: 'high-top-table', position: [-3, 0, -1], rotation: 0 },
      { templateId: 'high-top-table', position: [0, 0, -1], rotation: 0 },
      { templateId: 'high-top-table', position: [3, 0, -1], rotation: 0 },
      { templateId: 'high-top-table', position: [-2, 0, 2], rotation: 0 },
      { templateId: 'high-top-table', position: [2, 0, 2], rotation: 0 },
      { templateId: 'lounge', position: [-4, 0, 2], rotation: Math.PI / 2 },
      { templateId: 'lounge', position: [4, 0, 2], rotation: -Math.PI / 2 },
      { templateId: 'plant', position: [-4.5, 0, -4.5], rotation: 0 },
      { templateId: 'plant', position: [4.5, 0, -4.5], rotation: 0 },
    ]
  },
  {
    id: 'u-shape',
    name: 'U-Shape',
    description: 'Tables arranged in U formation for meetings',
    items: [
      { templateId: 'rectangular-table', position: [-3, 0, 0], rotation: Math.PI / 2 },
      { templateId: 'rectangular-table', position: [-3, 0, -2], rotation: Math.PI / 2 },
      { templateId: 'rectangular-table', position: [0, 0, -2], rotation: 0 },
      { templateId: 'rectangular-table', position: [3, 0, -2], rotation: Math.PI / 2 },
      { templateId: 'rectangular-table', position: [3, 0, 0], rotation: Math.PI / 2 },
      { templateId: 'podium', position: [0, 0, 2], rotation: 0 },
    ]
  }
]

const locationColors: Record<string, string> = {
  'main-ballroom': '#1a1a2e',
  'terrace': '#2d4a3e',
  'empty-room': '#2a2a2a',
  'keynote-room': '#1e2d40',
  'breakout-a': '#3d2b1f',
  'breakout-b': '#2b1f3d',
  'main-deck': '#1a3a4a',
}

function CADView({
  furniture,
  onFurnitureMove,
  roomDimensions,
  tableNumbers = {},
  width: canvasWidth = 300,
  height: canvasHeight = 300
}: {
  furniture: FurnitureItem[]
  onFurnitureMove: (id: string, x: number, z: number) => void
  roomDimensions: { width: number; depth: number }
  tableNumbers?: Record<string, number>
  width?: number
  height?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20)
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 0.5
      for (let i = 0; i <= 10; i++) {
        const pos = 10 + (i * (canvasWidth - 20) / 10)
        ctx.beginPath()
        ctx.moveTo(pos, 10)
        ctx.lineTo(pos, canvasHeight - 10)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(10, pos)
        ctx.lineTo(canvasWidth - 10, pos)
        ctx.stroke()
      }
      furniture.forEach((item) => {
        const template = furnitureTemplates.find(t => item.id.startsWith(t.id + '-'))
        if (!template) return
        const x = 10 + ((item.position[0] + roomDimensions.width / 2) / roomDimensions.width) * (canvasWidth - 20)
        const z = 10 + ((item.position[2] + roomDimensions.depth / 2) / roomDimensions.depth) * (canvasHeight - 20)
        const width = (template.dimensions.width / roomDimensions.width) * (canvasWidth - 20)
        const depth = (template.dimensions.depth / roomDimensions.depth) * (canvasHeight - 20)
        ctx.fillStyle = item.type === 'table' ? '#8B4513' : item.type === 'chair' ? '#654321' : '#4A4A4A'
        ctx.fillRect(x - width / 2, z - depth / 2, width, depth)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 1
        ctx.strokeRect(x - width / 2, z - depth / 2, width, depth)
        const tNum = tableNumbers[item.id]
        if (tNum !== undefined) {
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`#${tNum}`, x, z + 3)
          ctx.textAlign = 'left'
        }
      })
    }
    draw()
  }, [furniture, roomDimensions, tableNumbers, canvasWidth, canvasHeight])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    furniture.forEach((item) => {
      const template = furnitureTemplates.find(t => item.id.startsWith(t.id + '-'))
      if (!template) return
      const itemX = 10 + ((item.position[0] + roomDimensions.width / 2) / roomDimensions.width) * (canvasWidth - 20)
      const itemZ = 10 + ((item.position[2] + roomDimensions.depth / 2) / roomDimensions.depth) * (canvasHeight - 20)
      const width = (template.dimensions.width / roomDimensions.width) * (canvasWidth - 20)
      const depth = (template.dimensions.depth / roomDimensions.depth) * (canvasHeight - 20)
      if (x >= itemX - width / 2 && x <= itemX + width / 2 && y >= itemZ - depth / 2 && y <= itemZ + depth / 2) {
        setDragging(item.id)
        setDragOffset({ x: x - itemX, y: y - itemZ })
      }
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !dragOffset) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - dragOffset.x
    const y = e.clientY - rect.top - dragOffset.y
    const worldX = ((x - 10) / (canvasWidth - 20)) * roomDimensions.width - roomDimensions.width / 2
    const worldZ = ((y - 10) / (canvasHeight - 20)) * roomDimensions.depth - roomDimensions.depth / 2
    onFurnitureMove(dragging, worldX, worldZ)
  }

  const handleMouseUp = () => {
    setDragging(null)
    setDragOffset(null)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ border: `2px solid ${theme.accent}`, backgroundColor: '#f5f5f5', cursor: dragging ? 'grabbing' : 'grab', borderRadius: '8px', display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  )
}

function loadLocationLayout(location: VenueLocation): FurnitureItem[] {
  return location.layout.map((item) => ({
    id: item.id,
    type: item.type,
    position: [item.position[0], item.position[1], item.position[2]],
    rotation: item.rotation,
    scale: item.scale,
  }))
}

const MAX_HISTORY = 50

export default function LayoutDesigner3D() {
  const [selectedVenue, setSelectedVenue] = useState<Venue>(() => getDefaultVenue())
  const [selectedLocation, setSelectedLocation] = useState<VenueLocation>(() =>
    getDefaultLocation(getDefaultVenue())
  )
  const [furniture, setFurniture] = useState<FurnitureItem[]>(() =>
    loadLocationLayout(getDefaultLocation(getDefaultVenue()))
  )
  const [selectedTemplate, setSelectedTemplate] = useState<FurnitureTemplate | null>(null)
  const [panoramaImage, setPanoramaImage] = useState('/images/3d-layout-designer/panorama.jpg')
  const [roomDimensions, setRoomDimensions] = useState({ width: 10, depth: 10 })
  const [floorLevelY, setFloorLevelY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Record<string, string>>({})
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [saveConfirmation, setSaveConfirmation] = useState(false)
  const [history, setHistory] = useState<FurnitureItem[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [editingRotation, setEditingRotation] = useState<Record<string, string>>({})
  const [showLabels, setShowLabels] = useState(false)
  const [measureMode, setMeasureMode] = useState(false)
  const [lastMeasurement, setLastMeasurement] = useState<number | null>(null)
  const [zoomToFitTrigger, setZoomToFitTrigger] = useState(0)
  const [showCopyFrom, setShowCopyFrom] = useState(false)
  const [guests, setGuests] = useState<string[]>([])
  const [guestAssignments, setGuestAssignments] = useState<Record<string, string[]>>({})
  const [showGuestPanel, setShowGuestPanel] = useState(false)
  const [itemColors, setItemColors] = useState<Record<string, string>>({})
  const [customModels, setCustomModels] = useState<Array<{ id: string; url: string; position: [number,number,number]; rotation: number; scale: number }>>([])
  const [walkthroughMode, setWalkthroughMode] = useState(false)
  const [showOverflowMenu, setShowOverflowMenu] = useState(false)
  const [showFurniturePanel, setShowFurniturePanel] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(false)

  const saveKey = `layout-${selectedVenue.id}-${selectedLocation.id}`

  const pushHistory = useCallback((items: FurnitureItem[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1)
      const next = [...trimmed, items]
      if (next.length > MAX_HISTORY) next.shift()
      return next
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [historyIndex])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setFurniture(history[historyIndex - 1])
    }
  }, [historyIndex, history])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setFurniture(history[historyIndex + 1])
    }
  }, [historyIndex, history])

  const updateFurniture = useCallback((next: FurnitureItem[] | ((prev: FurnitureItem[]) => FurnitureItem[])) => {
    setFurniture(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next
      pushHistory(resolved)
      return resolved
    })
  }, [pushHistory])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(saveKey, JSON.stringify({ furniture, floorLevelY }))
      } catch { /* quota exceeded */ }
    }, 500)
    return () => clearTimeout(timer)
  }, [furniture, floorLevelY, saveKey])

  useEffect(() => {
    setPanoramaImage(selectedLocation.panorama)
    setRoomDimensions(selectedLocation.roomDimensions)
    const key = `layout-${selectedVenue.id}-${selectedLocation.id}`
    let loaded: FurnitureItem[]
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        loaded = parsed.furniture ?? []
        setFloorLevelY(parsed.floorLevelY ?? 0)
      } else {
        loaded = loadLocationLayout(selectedLocation)
        setFloorLevelY(0)
      }
    } catch {
      loaded = loadLocationLayout(selectedLocation)
      setFloorLevelY(0)
    }
    setFurniture(loaded)
    setHistory([loaded])
    setHistoryIndex(0)
  }, [selectedLocation, selectedVenue.id])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const layoutParam = params.get('layout')
    if (!layoutParam) return
    try {
      const data = JSON.parse(atob(layoutParam))
      const venue = findVenueById(data.v)
      if (!venue) return
      const location = findLocationById(venue, data.l)
      if (!location) return
      setSelectedVenue(venue)
      setSelectedLocation(location)
      if (data.f) {
        setFurniture(data.f.map((i: { i: string; t: string; p: number[]; r: number; s: number }) => ({
          id: i.i, type: i.t, position: i.p as [number, number, number], rotation: i.r, scale: i.s
        })))
      }
      if (data.y !== undefined) setFloorLevelY(data.y)
      window.history.replaceState({}, '', window.location.pathname)
    } catch { /* invalid share link */ }
  }, [])

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(saveKey, JSON.stringify({ furniture, floorLevelY }))
      setSaveConfirmation(true)
      setTimeout(() => setSaveConfirmation(false), 1500)
    } catch { /* silent */ }
  }, [saveKey, furniture, floorLevelY])

  const handleReset = useCallback(() => {
    localStorage.removeItem(saveKey)
    setFurniture(loadLocationLayout(selectedLocation))
    setFloorLevelY(0)
  }, [saveKey, selectedLocation])

  const capacityInfo = (() => {
    let totalSeats = 0
    let tableCount = 0
    let chairCount = 0
    let totalCost = 0
    for (const item of furniture) {
      const tpl = furnitureTemplates.find(t => item.id.startsWith(t.id + '-') || item.id === t.id)
      if (!tpl) continue
      totalSeats += tpl.seats
      totalCost += tpl.cost
      if (tpl.type === 'table') tableCount++
      if (tpl.type === 'chair') chairCount++
    }
    return { totalSeats, tableCount, chairCount, totalCost }
  })()

  const tableNumbers = useMemo(() => {
    const nums: Record<string, number> = {}
    let counter = 1
    for (const item of furniture) {
      const tpl = furnitureTemplates.find(t => item.id.startsWith(t.id + '-') || item.id === t.id)
      if (tpl && tpl.type === 'table') {
        nums[item.id] = counter++
      }
    }
    return nums
  }, [furniture])

  const complianceInfo = useMemo(() => {
    const area = roomDimensions.width * roomDimensions.depth
    const maxOccupancy = Math.floor(area / 1.4)
    const currentOccupancy = capacityInfo.totalSeats
    const overCapacity = currentOccupancy > maxOccupancy

    const minAisleWidth = 0.9
    let aisleViolations = 0
    for (let i = 0; i < furniture.length; i++) {
      const a = furniture[i]
      const tplA = furnitureTemplates.find(t => a.id.startsWith(t.id + '-') || a.id === t.id)
      if (!tplA) continue
      for (let j = i + 1; j < furniture.length; j++) {
        const b = furniture[j]
        const tplB = furnitureTemplates.find(t => b.id.startsWith(t.id + '-') || b.id === t.id)
        if (!tplB) continue
        const dx = Math.abs(a.position[0] - b.position[0])
        const dz = Math.abs(a.position[2] - b.position[2])
        const gapX = dx - (tplA.dimensions.width + tplB.dimensions.width) / 2
        const gapZ = dz - (tplA.dimensions.depth + tplB.dimensions.depth) / 2
        const gap = Math.min(dx < (tplA.dimensions.width + tplB.dimensions.width) / 2 ? Infinity : gapX, dz < (tplA.dimensions.depth + tplB.dimensions.depth) / 2 ? Infinity : gapZ)
        if (gap < minAisleWidth && gap > 0 && gap < Infinity) aisleViolations++
      }
    }

    let wallViolations = 0
    const hw = roomDimensions.width / 2
    const hd = roomDimensions.depth / 2
    for (const item of furniture) {
      const tpl = furnitureTemplates.find(t => item.id.startsWith(t.id + '-') || item.id === t.id)
      if (!tpl) continue
      const edgeX = hw - Math.abs(item.position[0]) - tpl.dimensions.width / 2
      const edgeZ = hd - Math.abs(item.position[2]) - tpl.dimensions.depth / 2
      if (edgeX < 0 || edgeZ < 0) wallViolations++
    }

    return { maxOccupancy, currentOccupancy, overCapacity, aisleViolations, wallViolations }
  }, [furniture, roomDimensions, capacityInfo.totalSeats])

  const collidingIds = useMemo(() => {
    const ids = new Set<string>()
    for (let i = 0; i < furniture.length; i++) {
      const a = furniture[i]
      const tplA = furnitureTemplates.find(t => a.id.startsWith(t.id + '-') || a.id === t.id)
      if (!tplA) continue
      for (let j = i + 1; j < furniture.length; j++) {
        const b = furniture[j]
        const tplB = furnitureTemplates.find(t => b.id.startsWith(t.id + '-') || b.id === t.id)
        if (!tplB) continue
        const overlapX = Math.abs(a.position[0] - b.position[0]) < (tplA.dimensions.width + tplB.dimensions.width) / 2 * 0.8
        const overlapZ = Math.abs(a.position[2] - b.position[2]) < (tplA.dimensions.depth + tplB.dimensions.depth) / 2 * 0.8
        if (overlapX && overlapZ) {
          ids.add(a.id)
          ids.add(b.id)
        }
      }
    }
    return Array.from(ids)
  }, [furniture])

  const handleExport = useCallback(() => {
    const sourceCanvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!sourceCanvas) return
    const exportCanvas = document.createElement('canvas')
    const w = sourceCanvas.width
    const h = sourceCanvas.height
    exportCanvas.width = w
    exportCanvas.height = h
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(sourceCanvas, 0, 0)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fillRect(0, h - 80, w, 80)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText(`${selectedVenue.name} — ${selectedLocation.name}`, 16, h - 52)
    ctx.font = '14px sans-serif'
    ctx.fillText(`${new Date().toLocaleDateString()} | ${furniture.length} items | ${capacityInfo.totalSeats} seats`, 16, h - 28)
    const link = document.createElement('a')
    link.download = `${selectedVenue.id}-${selectedLocation.id}-layout-${Date.now()}.png`
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
  }, [selectedVenue, selectedLocation, furniture, capacityInfo.totalSeats])

  const handleExportFloorPlan = useCallback(() => {
    const w = 1200
    const h = 900
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const margin = 80
    const drawW = w - margin * 2
    const drawH = h - margin * 2 - 60

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#003366'
    ctx.fillRect(0, 0, w, 50)
    ctx.fillStyle = '#FFC72C'
    ctx.fillRect(0, 50, w, 3)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText(`${selectedVenue.name} — ${selectedLocation.name}`, 16, 33)
    ctx.font = '12px sans-serif'
    ctx.fillText(`${new Date().toLocaleDateString()} | ${roomDimensions.width}m × ${roomDimensions.depth}m`, w - 280, 33)

    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.strokeRect(margin, margin + 10, drawW, drawH)

    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5
    const gridSpacing = 1
    for (let x = 0; x <= roomDimensions.width; x += gridSpacing) {
      const px = margin + (x / roomDimensions.width) * drawW
      ctx.beginPath(); ctx.moveTo(px, margin + 10); ctx.lineTo(px, margin + 10 + drawH); ctx.stroke()
    }
    for (let z = 0; z <= roomDimensions.depth; z += gridSpacing) {
      const pz = margin + 10 + (z / roomDimensions.depth) * drawH
      ctx.beginPath(); ctx.moveTo(margin, pz); ctx.lineTo(margin + drawW, pz); ctx.stroke()
    }

    ctx.fillStyle = '#333'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${roomDimensions.width}m`, margin + drawW / 2, margin + 10 + drawH + 20)
    ctx.save()
    ctx.translate(margin - 20, margin + 10 + drawH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${roomDimensions.depth}m`, 0, 0)
    ctx.restore()
    ctx.textAlign = 'left'

    furniture.forEach((item) => {
      const tpl = furnitureTemplates.find(t => item.id.startsWith(t.id + '-') || item.id === t.id)
      if (!tpl) return
      const cx = margin + ((item.position[0] + roomDimensions.width / 2) / roomDimensions.width) * drawW
      const cz = margin + 10 + ((item.position[2] + roomDimensions.depth / 2) / roomDimensions.depth) * drawH
      const fw = (tpl.dimensions.width / roomDimensions.width) * drawW
      const fd = (tpl.dimensions.depth / roomDimensions.depth) * drawH

      ctx.save()
      ctx.translate(cx, cz)
      ctx.rotate(item.rotation)

      ctx.fillStyle = tpl.type === 'table' ? '#D4A574' : tpl.type === 'chair' ? '#A0785A' : tpl.type === 'stage' ? '#888' : tpl.type === 'bar' ? '#6B4226' : '#999'
      if (tpl.shape === 'round-table' || tpl.shape === 'high-top' || tpl.shape === 'standing-table') {
        ctx.beginPath()
        ctx.ellipse(0, 0, fw / 2, fd / 2, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke()
      } else {
        ctx.fillRect(-fw / 2, -fd / 2, fw, fd)
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.strokeRect(-fw / 2, -fd / 2, fw, fd)
      }

      ctx.fillStyle = '#333'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(tpl.name, 0, fd / 2 + 12)

      ctx.restore()
    })

    const legendY = h - 40
    ctx.fillStyle = '#003366'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Legend:', margin, legendY)
    const legendItems = [
      { color: '#D4A574', label: 'Tables' },
      { color: '#A0785A', label: 'Chairs' },
      { color: '#888', label: 'Stage' },
      { color: '#6B4226', label: 'Bar' },
      { color: '#999', label: 'Other' }
    ]
    let lx = margin + 60
    legendItems.forEach(({ color, label }) => {
      ctx.fillStyle = color
      ctx.fillRect(lx, legendY - 10, 14, 14)
      ctx.strokeStyle = '#333'; ctx.lineWidth = 0.5; ctx.strokeRect(lx, legendY - 10, 14, 14)
      ctx.fillStyle = '#333'
      ctx.font = '11px sans-serif'
      ctx.fillText(label, lx + 18, legendY + 2)
      lx += 80
    })

    ctx.fillStyle = '#003366'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(`${capacityInfo.totalSeats} seats | ${capacityInfo.tableCount} tables | ${capacityInfo.chairCount} chairs | ${furniture.length} items`, w - 400, legendY)

    const scaleBarMeters = Math.round(roomDimensions.width / 4)
    const scaleBarPx = (scaleBarMeters / roomDimensions.width) * drawW
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(margin, legendY - 25); ctx.lineTo(margin + scaleBarPx, legendY - 25); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(margin, legendY - 30); ctx.lineTo(margin, legendY - 20); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(margin + scaleBarPx, legendY - 30); ctx.lineTo(margin + scaleBarPx, legendY - 20); ctx.stroke()
    ctx.fillStyle = '#333'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(`${scaleBarMeters}m`, margin + scaleBarPx / 2, legendY - 32)

    const link = document.createElement('a')
    link.download = `${selectedVenue.id}-${selectedLocation.id}-floorplan-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [selectedVenue, selectedLocation, furniture, roomDimensions, capacityInfo])

  const handleShare = useCallback(() => {
    const data = {
      v: selectedVenue.id,
      l: selectedLocation.id,
      f: furniture.map(i => ({
        i: i.id, t: i.type, p: i.position.map(n => +n.toFixed(2)), r: +i.rotation.toFixed(3), s: i.scale
      })),
      y: +floorLevelY.toFixed(2)
    }
    const encoded = btoa(JSON.stringify(data))
    const url = `${window.location.origin}${window.location.pathname}?layout=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      alert('Share link copied to clipboard!')
    }).catch(() => {
      prompt('Copy this share link:', url)
    })
  }, [selectedVenue, selectedLocation, furniture, floorLevelY])

  const handleDuplicate = useCallback(() => {
    if (selectedItemIds.length === 0) return
    const duplicates = furniture
      .filter(item => selectedItemIds.includes(item.id))
      .map(item => ({
        ...item,
        id: `${item.id.split('-').slice(0, -1).join('-')}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        position: [item.position[0] + 0.5, item.position[1], item.position[2] + 0.5] as [number, number, number]
      }))
    const next = [...furniture, ...duplicates]
    updateFurniture(next)
    setSelectedItemIds(duplicates.map(d => d.id))
  }, [selectedItemIds, furniture, updateFurniture])

  const handleDeleteSelected = useCallback(() => {
    if (selectedItemIds.length === 0) return
    updateFurniture(furniture.filter(item => !selectedItemIds.includes(item.id)))
    setSelectedItemIds([])
  }, [selectedItemIds, furniture, updateFurniture])

  const nudgeSelected = useCallback((dx: number, dz: number) => {
    updateFurniture(furniture.map(item =>
      selectedItemIds.includes(item.id)
        ? { ...item, position: [item.position[0] + dx, item.position[1], item.position[2] + dz] as [number, number, number] }
        : item
    ))
  }, [selectedItemIds, furniture, updateFurniture])

  const handleCopyLayout = useCallback((sourceVenueId: string, sourceLocationId: string) => {
    const key = `layout-${sourceVenueId}-${sourceLocationId}`
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        const items = (parsed.furniture ?? []).map((item: FurnitureItem) => ({
          ...item,
          id: `${item.id.split('-').slice(0, -1).join('-')}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        }))
        updateFurniture([...furniture, ...items])
      } else {
        const sourceVenue = findVenueById(sourceVenueId)
        if (!sourceVenue) return
        const sourceLoc = findLocationById(sourceVenue, sourceLocationId)
        if (!sourceLoc) return
        const items = loadLocationLayout(sourceLoc).map(item => ({
          ...item,
          id: `${item.id.split('-').slice(0, -1).join('-')}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        }))
        updateFurniture([...furniture, ...items])
      }
    } catch { /* silent */ }
    setShowCopyFrom(false)
  }, [furniture, updateFurniture])

  const handleImportGuests = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.txt'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        const names = text.split(/[\n,]/).map(n => n.trim()).filter(n => n.length > 0 && n !== 'Name' && n !== 'name')
        setGuests(prev => [...new Set([...prev, ...names])])
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  const handleAssignGuest = useCallback((guestName: string, tableId: string) => {
    setGuestAssignments(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter(g => g !== guestName)
        if (next[key].length === 0) delete next[key]
      }
      if (!next[tableId]) next[tableId] = []
      next[tableId].push(guestName)
      return next
    })
  }, [])

  const handleUnassignGuest = useCallback((guestName: string) => {
    setGuestAssignments(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter(g => g !== guestName)
        if (next[key].length === 0) delete next[key]
      }
      return next
    })
  }, [])

  const handleAddGuest = useCallback((name: string) => {
    if (name.trim()) setGuests(prev => [...prev, name.trim()])
  }, [])

  const handleRemoveGuest = useCallback((name: string) => {
    setGuests(prev => prev.filter(g => g !== name))
    handleUnassignGuest(name)
  }, [handleUnassignGuest])

  const handleApplyTemplate = useCallback((template: LayoutTemplate) => {
    const items: FurnitureItem[] = template.items.map((item, i) => {
      const tpl = furnitureTemplates.find(t => t.id === item.templateId)
      return {
        id: `${item.templateId}-${Date.now()}-${i}`,
        type: tpl?.type ?? 'decoration',
        position: item.position,
        rotation: item.rotation,
        scale: 1
      }
    })
    updateFurniture(items)
  }, [updateFurniture])

  const handleImportModel = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.glb,.gltf'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      setCustomModels(prev => [...prev, {
        id: `custom-${Date.now()}`,
        url,
        position: [0, 0, 0],
        rotation: 0,
        scale: 1
      }])
    }
    input.click()
  }, [])

  const handleExportReport = useCallback(() => {
    const pageW = 1200
    const pageH = 900
    const pages: HTMLCanvasElement[] = []

    const p1 = document.createElement('canvas')
    p1.width = pageW; p1.height = pageH
    const c1 = p1.getContext('2d')!
    c1.fillStyle = '#fff'; c1.fillRect(0, 0, pageW, pageH)
    c1.fillStyle = '#003366'; c1.fillRect(0, 0, pageW, 80)
    c1.fillStyle = '#FFC72C'; c1.fillRect(0, 80, pageW, 4)
    c1.fillStyle = '#fff'; c1.font = 'bold 28px sans-serif'
    c1.fillText('Event Layout Report', 30, 50)
    c1.font = '16px sans-serif'
    c1.fillText(`${selectedVenue.name} — ${selectedLocation.name}`, 30, 72)
    c1.fillStyle = '#333'; c1.font = '14px sans-serif'
    c1.fillText(`Generated: ${new Date().toLocaleString()}`, 30, 110)
    c1.fillText(`Room: ${roomDimensions.width}m × ${roomDimensions.depth}m (${(roomDimensions.width * roomDimensions.depth).toFixed(0)} m²)`, 30, 135)
    const srcCanvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (srcCanvas) {
      const rh = 500
      const rw = Math.round(rh * (srcCanvas.width / srcCanvas.height))
      const rx = (pageW - rw) / 2
      c1.drawImage(srcCanvas, rx, 170, rw, rh)
      c1.strokeStyle = '#003366'; c1.lineWidth = 2
      c1.strokeRect(rx, 170, rw, rh)
    }
    c1.fillStyle = '#003366'; c1.font = 'bold 14px sans-serif'
    c1.fillText(`${capacityInfo.totalSeats} seats | ${capacityInfo.tableCount} tables | ${furniture.length} items | $${capacityInfo.totalCost} estimated`, 30, pageH - 30)
    pages.push(p1)

    const p2 = document.createElement('canvas')
    p2.width = pageW; p2.height = pageH
    const c2 = p2.getContext('2d')!
    c2.fillStyle = '#fff'; c2.fillRect(0, 0, pageW, pageH)
    c2.fillStyle = '#003366'; c2.fillRect(0, 0, pageW, 50)
    c2.fillStyle = '#FFC72C'; c2.fillRect(0, 50, pageW, 3)
    c2.fillStyle = '#fff'; c2.font = 'bold 18px sans-serif'
    c2.fillText('Item Inventory', 30, 35)

    const counts: Record<string, { count: number; seats: number; cost: number }> = {}
    for (const item of furniture) {
      const tpl = furnitureTemplates.find(t => item.id.startsWith(t.id + '-') || item.id === t.id)
      if (!tpl) continue
      if (!counts[tpl.name]) counts[tpl.name] = { count: 0, seats: 0, cost: 0 }
      counts[tpl.name].count++
      counts[tpl.name].seats += tpl.seats
      counts[tpl.name].cost += tpl.cost
    }

    let y2 = 85
    c2.fillStyle = '#003366'; c2.font = 'bold 12px sans-serif'
    c2.fillText('Item', 30, y2); c2.fillText('Qty', 300, y2); c2.fillText('Seats', 380, y2); c2.fillText('Cost', 460, y2)
    c2.strokeStyle = '#003366'; c2.lineWidth = 1
    c2.beginPath(); c2.moveTo(30, y2 + 5); c2.lineTo(550, y2 + 5); c2.stroke()
    y2 += 25
    c2.font = '12px sans-serif'; c2.fillStyle = '#333'
    for (const [name, data] of Object.entries(counts)) {
      c2.fillText(name, 30, y2)
      c2.fillText(String(data.count), 300, y2)
      c2.fillText(String(data.seats), 380, y2)
      c2.fillText(`$${data.cost}`, 460, y2)
      y2 += 22
    }
    y2 += 10
    c2.fillStyle = '#003366'; c2.font = 'bold 13px sans-serif'
    c2.fillText(`Total: ${furniture.length} items | ${capacityInfo.totalSeats} seats | $${capacityInfo.totalCost}`, 30, y2)

    y2 += 40
    c2.fillStyle = '#003366'; c2.font = 'bold 14px sans-serif'
    c2.fillText('Compliance Check', 30, y2)
    y2 += 22
    c2.font = '12px sans-serif'
    c2.fillStyle = complianceInfo.overCapacity ? '#c53030' : '#2f855a'
    c2.fillText(`Occupancy: ${complianceInfo.currentOccupancy}/${complianceInfo.maxOccupancy} ${complianceInfo.overCapacity ? '— OVER CAPACITY' : '— OK'}`, 30, y2)
    y2 += 20
    c2.fillStyle = complianceInfo.aisleViolations > 0 ? '#c53030' : '#2f855a'
    c2.fillText(`Aisle clearance (ADA 0.9m min): ${complianceInfo.aisleViolations > 0 ? complianceInfo.aisleViolations + ' violations' : 'OK'}`, 30, y2)
    y2 += 20
    c2.fillStyle = complianceInfo.wallViolations > 0 ? '#c53030' : '#2f855a'
    c2.fillText(`Items within room boundary: ${complianceInfo.wallViolations > 0 ? complianceInfo.wallViolations + ' outside' : 'OK'}`, 30, y2)

    if (guests.length > 0) {
      y2 += 40
      c2.fillStyle = '#003366'; c2.font = 'bold 14px sans-serif'
      c2.fillText(`Seating Chart (${Object.values(guestAssignments).flat().length}/${guests.length} assigned)`, 30, y2)
      y2 += 22
      c2.font = '11px sans-serif'; c2.fillStyle = '#333'
      const tables = furniture.filter(i => { const t = furnitureTemplates.find(tpl => i.id.startsWith(tpl.id + '-')); return t?.type === 'table' })
      for (const table of tables) {
        const tNum = tableNumbers[table.id]
        const assigned = guestAssignments[table.id] || []
        if (tNum === undefined) continue
        c2.fillStyle = '#003366'; c2.font = 'bold 11px sans-serif'
        c2.fillText(`Table #${tNum}:`, 30, y2)
        c2.fillStyle = '#333'; c2.font = '11px sans-serif'
        c2.fillText(assigned.length > 0 ? assigned.join(', ') : '(no guests)', 120, y2)
        y2 += 18
        if (y2 > pageH - 40) break
      }
    }

    pages.push(p2)

    pages.forEach((page, i) => {
      const link = document.createElement('a')
      link.download = `${selectedVenue.id}-${selectedLocation.id}-report-page${i + 1}-${Date.now()}.png`
      link.href = page.toDataURL('image/png')
      link.click()
    })
  }, [selectedVenue, selectedLocation, furniture, roomDimensions, capacityInfo, complianceInfo, guests, guestAssignments, tableNumbers])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return
    const newItem: FurnitureItem = {
      id: `${selectedTemplate.id}-${Date.now()}`,
      type: selectedTemplate.type,
      position: [0, 0, 0],
      rotation: 0,
      scale: 1
    }
    updateFurniture([...furniture, newItem])
    setSelectedTemplate(null)
    setIsDragging(false)
  }

  const handleFurnitureDrop = (position: [number, number, number]) => {
    if (!selectedTemplate) return
    const newItem: FurnitureItem = {
      id: `${selectedTemplate.id}-${Date.now()}`,
      type: selectedTemplate.type,
      position: [position[0], 0, position[2]],
      rotation: 0,
      scale: 1
    }
    updateFurniture(prev => [...prev, newItem])
    setSelectedTemplate(null)
    setIsDragging(false)
  }

  const handleTemplateSelect = (template: FurnitureTemplate) => {
    setSelectedTemplate(template)
    setIsDragging(true)
  }

  const handleFurnitureMove = (id: string, x: number, z: number) => {
    updateFurniture(furniture.map(item =>
      item.id === id ? { ...item, position: [x, item.position[1], z] } : item
    ))
  }

  const positionInputKey = (id: string, axis: number) => `${id}-${axis}`

  const handleFurniturePositionChange = (id: string, axis: 0 | 1 | 2, value: number) => {
    updateFurniture(furniture.map(item => {
      if (item.id !== id) return item
      const next = [...item.position]
      next[axis] = value
      return { ...item, position: next as [number, number, number] }
    }))
    setEditingPosition(prev => {
      const key = positionInputKey(id, axis)
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const getPositionInputValue = (item: FurnitureItem, axis: 0 | 1 | 2) => {
    const key = positionInputKey(item.id, axis)
    if (editingPosition[key] !== undefined) return editingPosition[key]
    return item.position[axis].toFixed(2)
  }

  const setPositionInputValue = (itemId: string, axis: 0 | 1 | 2, raw: string) => {
    setEditingPosition(prev => ({ ...prev, [positionInputKey(itemId, axis)]: raw }))
  }

  const commitPositionInput = (itemId: string, axis: 0 | 1 | 2, raw: string) => {
    const num = Number(raw)
    if (!Number.isNaN(num)) handleFurniturePositionChange(itemId, axis, num)
    else setEditingPosition(prev => {
      const next = { ...prev }
      delete next[positionInputKey(itemId, axis)]
      return next
    })
  }

  const getRotationInputValue = (item: FurnitureItem) => {
    if (editingRotation[item.id] !== undefined) return editingRotation[item.id]
    return ((item.rotation * 180) / Math.PI).toFixed(1)
  }

  const setRotationInputValue = (id: string, raw: string) => {
    setEditingRotation(prev => ({ ...prev, [id]: raw }))
  }

  const commitRotationInput = (id: string, raw: string) => {
    const deg = Number(raw)
    if (!Number.isNaN(deg)) {
      updateFurniture(furniture.map(i => i.id === id ? { ...i, rotation: (deg * Math.PI) / 180 } : i))
    }
    setEditingRotation(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const handleDeleteFurniture = (id: string) => {
    updateFurniture(furniture.filter(item => item.id !== id))
  }

  const handleVenueChange = (venueId: string) => {
    const venue = findVenueById(venueId)
    if (venue) {
      setSelectedVenue(venue)
      setSelectedLocation(venue.locations[0])
    }
  }

  const handleLocationChange = (locationId: string) => {
    const location = findLocationById(selectedVenue, locationId)
    if (location) setSelectedLocation(location)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return

      const isMeta = e.metaKey || e.ctrlKey

      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if (isMeta && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        handleRedo()
      } else if (isMeta && e.key === 'd') {
        e.preventDefault()
        handleDuplicate()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemIds.length > 0) {
        e.preventDefault()
        handleDeleteSelected()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setSelectedTemplate(null)
        setIsDragging(false)
        setSelectedItemIds([])
        setMeasureMode(false)
        setShowOverflowMenu(false)
      } else if (e.key === 'ArrowUp' && selectedItemIds.length > 0) {
        e.preventDefault()
        nudgeSelected(0, -0.5)
      } else if (e.key === 'ArrowDown' && selectedItemIds.length > 0) {
        e.preventDefault()
        nudgeSelected(0, 0.5)
      } else if (e.key === 'ArrowLeft' && selectedItemIds.length > 0) {
        e.preventDefault()
        nudgeSelected(-0.5, 0)
      } else if (e.key === 'ArrowRight' && selectedItemIds.length > 0) {
        e.preventDefault()
        nudgeSelected(0.5, 0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo, handleDuplicate, selectedItemIds, handleDeleteSelected, nudgeSelected])

  const hasComplianceIssues = complianceInfo.overCapacity || complianceInfo.aisleViolations > 0 || complianceInfo.wallViolations > 0

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>

      {/* ── Full-viewport 3D Canvas ── */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <DynamicCanvas
          furniture={furniture}
          panoramaImage={panoramaImage}
          onFurnitureDrop={handleFurnitureDrop}
          isPlacing={isDragging && selectedTemplate !== null}
          furnitureTemplates={furnitureTemplates}
          floorLevelY={floorLevelY}
          selectedFurnitureIds={selectedItemIds}
          onFurnitureSelect={(id: string | null, shiftKey?: boolean) => {
            if (id === null) {
              setSelectedItemIds([])
            } else if (shiftKey) {
              setSelectedItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
            } else {
              setSelectedItemIds([id])
            }
          }}
          onFurnitureMove={(id: string, pos: [number, number, number]) => {
            updateFurniture(prev => prev.map(item => item.id === id ? { ...item, position: pos } : item))
          }}
          snapToGrid={snapToGrid}
          gridSize={0.5}
          roomDimensions={roomDimensions}
          roomColor={locationColors[selectedLocation.id] || '#336699'}
          showLabels={showLabels}
          measureMode={measureMode}
          onMeasureComplete={(dist: number) => setLastMeasurement(dist)}
          zoomToFitTrigger={zoomToFitTrigger}
          collidingIds={collidingIds}
          tableNumbers={tableNumbers}
          guestAssignments={guestAssignments}
          walkthroughMode={walkthroughMode}
          itemColors={itemColors}
          customModels={customModels}
        />
      </div>

      {/* Placement instruction */}
      {isDragging && selectedTemplate && (
        <div style={{ position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 200, pointerEvents: 'none' }}>
          <div className="glass" style={{ padding: '10px 20px', borderRadius: theme.radiusSm, color: theme.accent, fontWeight: 600, fontSize: 13 }}>
            Click on the floor to place {selectedTemplate.name} &mdash; press Esc to cancel
          </div>
        </div>
      )}

      {/* Empty state */}
      {furniture.length === 0 && !isDragging && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 200, pointerEvents: 'none' }}>
          <div className="glass" style={{ padding: '24px 32px', borderRadius: theme.radius, textAlign: 'center', maxWidth: 320, border: `2px solid ${theme.accentLight}` }}>
            <p style={{ margin: 0, fontSize: 15, color: theme.text, fontWeight: 600 }}>Click furniture from the panel to place it</p>
            <p style={{ fontSize: 13, marginTop: 10, color: theme.textSecondary }}>Use mouse to rotate, zoom, and pan the view</p>
          </div>
        </div>
      )}

      {/* Walkthrough HUD */}
      {walkthroughMode && (
        <div style={{ position: 'absolute', top: 64, left: 16, zIndex: 200, pointerEvents: 'none' }}>
          <div className="glass" style={{ padding: '10px 14px', borderRadius: theme.radiusSm, fontSize: 12, border: `1px solid ${theme.accentLight}` }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: theme.text }}>Walkthrough Mode</div>
            <div style={{ color: theme.textSecondary }}>Click to lock mouse · WASD to move · Mouse to look</div>
            <div style={{ color: theme.textSecondary }}>Press Escape to exit</div>
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <header
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 48, zIndex: 150,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
          background: 'rgba(0, 51, 102, 0.92)',
          backdropFilter: theme.blur,
          WebkitBackdropFilter: theme.blur,
          borderBottom: `2px solid ${theme.accentLight}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/images/coe-logo.svg" alt="City of Edmonton" style={{ height: 32 }} />
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>3D Layout Designer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select className="csel" value={selectedVenue.id} onChange={(e) => handleVenueChange(e.target.value)}>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select className="csel" value={selectedLocation.id} onChange={(e) => handleLocationChange(e.target.value)}>
            {selectedVenue.locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              backgroundColor: saveConfirmation ? theme.success : theme.accentLight,
              color: saveConfirmation ? '#fff' : theme.accent,
              border: 'none', borderRadius: theme.radiusSm, cursor: 'pointer',
              fontWeight: 600, fontSize: 13, transition: 'all 200ms',
            }}
          >
            {saveConfirmation ? '✓ Saved' : 'Save'}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowOverflowMenu(prev => !prev)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: theme.radiusSm,
                color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1,
              }}
            >
              ⋮
            </button>
            {showOverflowMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowOverflowMenu(false)} />
                <div className="omenu glass" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 200, borderRadius: theme.radius, padding: '6px 0', zIndex: 300, animation: 'fadeIn 150ms ease' }}>
                  <button onClick={() => { setShowOverflowMenu(false); const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (ev) => { const file = (ev.target as HTMLInputElement).files?.[0]; if (file) setPanoramaImage(URL.createObjectURL(file)); }; input.click(); }}>
                    Load Panorama
                  </button>
                  <button onClick={() => { setShowOverflowMenu(false); handleImportModel(); }}>
                    Import 3D
                  </button>
                  <hr />
                  <button onClick={() => { setShowOverflowMenu(false); handleExport(); }}>
                    Export PNG
                  </button>
                  <button onClick={() => { setShowOverflowMenu(false); handleExportFloorPlan(); }}>
                    Floor Plan
                  </button>
                  <button onClick={() => { setShowOverflowMenu(false); handleExportReport(); }}>
                    Report
                  </button>
                  <button onClick={() => { setShowOverflowMenu(false); handleShare(); }}>
                    Share
                  </button>
                  <hr />
                  <button onClick={() => { setShowOverflowMenu(false); setShowGuestPanel(prev => !prev); }}>
                    Guests {showGuestPanel ? '✓' : ''}
                  </button>
                  <button onClick={() => { setShowOverflowMenu(false); setShowMiniMap(prev => !prev); }}>
                    Floor Plan View {showMiniMap ? '✓' : ''}
                  </button>
                  <button onClick={() => { setShowOverflowMenu(false); setShowCopyFrom(true); }}>
                    Copy From…
                  </button>
                  <hr />
                  <button onClick={() => { setShowOverflowMenu(false); setFurniture([]); }}>
                    Clear All
                  </button>
                  <button onClick={() => { setShowOverflowMenu(false); handleReset(); }} style={{ color: theme.danger }}>
                    Reset
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── LEFT PANEL: Furniture Library ── */}
      {!showFurniturePanel && (
        <button className="ptab" onClick={() => setShowFurniturePanel(true)}>
          ☰
        </button>
      )}
      {showFurniturePanel && (
        <aside
          className="glass"
          style={{
            position: 'absolute', top: 60, left: 12, bottom: 68, width: 240, zIndex: 100,
            borderRadius: theme.radius, padding: 0, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', animation: 'slideLeft 200ms ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px', borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>Furniture</span>
            <button
              onClick={() => setShowFurniturePanel(false)}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: theme.textSecondary, lineHeight: 1, padding: 0 }}
            >×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
            {/* Layout Templates */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: theme.textSecondary, fontWeight: 600, marginBottom: 6, padding: '0 4px' }}>Templates</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {layoutTemplatePatterns.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleApplyTemplate(t)}
                    title={t.description}
                    style={{ padding: '4px 10px', backgroundColor: 'rgba(0,51,102,0.06)', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: theme.accent, transition: 'all 150ms' }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Furniture Grid */}
            <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: theme.textSecondary, fontWeight: 600, marginBottom: 6, padding: '0 4px' }}>Items</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {furnitureTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`fcard${selectedTemplate?.id === template.id ? ' sel' : ''}`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{template.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: theme.text, lineHeight: 1.2 }}>{template.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Capacity + Compliance footer */}
          {furniture.length > 0 && (
            <div style={{ padding: '8px 14px', borderTop: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', color: theme.textSecondary, marginBottom: hasComplianceIssues ? 4 : 0 }}>
                <span style={{ fontWeight: 700, color: theme.accent }}>{capacityInfo.totalSeats} seats</span>
                <span>{capacityInfo.tableCount} tbl</span>
                <span>{capacityInfo.chairCount} chr</span>
                <span style={{ fontWeight: 700, color: theme.accent }}>${capacityInfo.totalCost}</span>
              </div>
              {hasComplianceIssues ? (
                <div style={{ fontSize: 10, color: theme.danger, fontWeight: 600 }}>
                  {complianceInfo.overCapacity && <div>⚠ Over capacity ({complianceInfo.currentOccupancy}/{complianceInfo.maxOccupancy})</div>}
                  {complianceInfo.aisleViolations > 0 && <div>⚠ {complianceInfo.aisleViolations} narrow aisle(s)</div>}
                  {complianceInfo.wallViolations > 0 && <div>⚠ {complianceInfo.wallViolations} outside room</div>}
                </div>
              ) : (
                <div style={{ fontSize: 10, color: theme.success, fontWeight: 600 }}>✓ Compliant</div>
              )}
            </div>
          )}
        </aside>
      )}

      {/* ── RIGHT PANEL: Properties (contextual) ── */}
      {selectedItemIds.length > 0 && (() => {
        const selectedItems = furniture.filter(item => selectedItemIds.includes(item.id))
        const singleItem = selectedItems.length === 1 ? selectedItems[0] : null
        const singleTemplate = singleItem ? furnitureTemplates.find(t => singleItem.id.startsWith(t.id + '-') || singleItem.id === t.id) : null

        return (
          <aside
            className="glass"
            style={{
              position: 'absolute', top: 60, right: 12, width: 260, zIndex: 100,
              borderRadius: theme.radius, padding: 14, maxHeight: 'calc(100vh - 130px)',
              overflowY: 'auto', animation: 'slideRight 200ms ease',
            }}
          >
            {singleItem ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    {tableNumbers[singleItem.id] !== undefined && (
                      <span style={{ display: 'inline-block', backgroundColor: theme.accentLight, color: theme.accent, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginRight: 6 }}>
                        #{tableNumbers[singleItem.id]}
                      </span>
                    )}
                    <span style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>{singleTemplate?.name || 'Unknown'}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteFurniture(singleItem.id)}
                    style={{ padding: '4px 8px', backgroundColor: theme.danger, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >×</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                  {(['X', 'Y', 'Z'] as const).map((label, axis) => (
                    <div key={label}>
                      <label style={{ display: 'block', color: theme.textSecondary, fontSize: 10, marginBottom: 2 }}>{label}</label>
                      <input
                        className="pinput"
                        type="text"
                        inputMode="decimal"
                        value={getPositionInputValue(singleItem, axis as 0 | 1 | 2)}
                        onChange={(e) => setPositionInputValue(singleItem.id, axis as 0 | 1 | 2, e.target.value)}
                        onBlur={(e) => commitPositionInput(singleItem.id, axis as 0 | 1 | 2, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && commitPositionInput(singleItem.id, axis as 0 | 1 | 2, (e.target as HTMLInputElement).value)}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <label style={{ color: theme.textSecondary, fontSize: 10, minWidth: 24 }}>Rot°</label>
                  <input
                    className="pinput"
                    type="text"
                    inputMode="decimal"
                    value={getRotationInputValue(singleItem)}
                    onChange={(e) => setRotationInputValue(singleItem.id, e.target.value)}
                    onBlur={(e) => commitRotationInput(singleItem.id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitRotationInput(singleItem.id, (e.target as HTMLInputElement).value)}
                    style={{ width: 56 }}
                  />
                  <button
                    onClick={() => updateFurniture(furniture.map(i => i.id === singleItem.id ? { ...i, rotation: i.rotation + Math.PI / 4 } : i))}
                    style={{ padding: '4px 8px', backgroundColor: 'rgba(0,51,102,0.08)', color: theme.accent, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                  >+45°</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ color: theme.textSecondary, fontSize: 10, minWidth: 24 }}>Color</label>
                  <input
                    type="color"
                    value={itemColors[singleItem.id] || '#8B4513'}
                    onChange={(e) => setItemColors(prev => ({ ...prev, [singleItem.id]: e.target.value }))}
                    style={{ width: 28, height: 22, padding: 0, border: `1px solid ${theme.border}`, borderRadius: 4, cursor: 'pointer' }}
                  />
                  {itemColors[singleItem.id] && (
                    <button
                      onClick={() => setItemColors(prev => { const n = { ...prev }; delete n[singleItem.id]; return n })}
                      style={{ padding: '2px 8px', fontSize: 10, backgroundColor: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: 4, cursor: 'pointer', color: theme.textSecondary }}
                    >Reset</button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, fontSize: 14, color: theme.text, marginBottom: 12 }}>
                  {selectedItems.length} items selected
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleDeleteSelected}
                    style={{ padding: '6px 12px', backgroundColor: theme.danger, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >Delete All</button>
                  <button
                    onClick={handleDuplicate}
                    style={{ padding: '6px 12px', backgroundColor: 'rgba(0,51,102,0.08)', color: theme.accent, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >Duplicate</button>
                  <button
                    onClick={() => setSelectedItemIds([])}
                    style={{ padding: '6px 12px', backgroundColor: 'rgba(0,0,0,0.04)', color: theme.textSecondary, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >Deselect</button>
                </div>
              </>
            )}
          </aside>
        )
      })()}

      {/* ── BOTTOM TOOL STRIP ── */}
      <div
        className="glass"
        style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 150, height: 44, borderRadius: 22, padding: '0 8px',
          display: 'flex', alignItems: 'center', gap: 2,
        }}
      >
        <button className={`tbtn${snapToGrid ? ' on' : ''}`} data-tip="Snap to Grid" onClick={() => setSnapToGrid(prev => !prev)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
        </button>
        <button className={`tbtn${showLabels ? ' on' : ''}`} data-tip="Labels" onClick={() => setShowLabels(prev => !prev)} style={{ fontSize: 13, fontWeight: 700 }}>
          Aa
        </button>
        <button className={`tbtn${measureMode ? ' on' : ''}`} data-tip="Measure" onClick={() => setMeasureMode(prev => !prev)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h12M2 6v4M14 6v4M5 8v2M8 8v3M11 8v2"/></svg>
        </button>
        {lastMeasurement !== null && (
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.accent, padding: '0 4px', background: 'rgba(0,51,102,0.06)', borderRadius: 4 }}>{lastMeasurement.toFixed(2)}m</span>
        )}
        <div style={{ width: 1, height: 20, backgroundColor: theme.border, margin: '0 4px' }} />
        <button className={`tbtn${walkthroughMode ? ' on' : ''}`} data-tip="Walkthrough" onClick={() => setWalkthroughMode(prev => !prev)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/></svg>
        </button>
        <button className="tbtn" data-tip="Zoom to Fit" onClick={() => setZoomToFitTrigger(prev => prev + 1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6V3a1 1 0 011-1h3M10 2h3a1 1 0 011 1v3M14 10v3a1 1 0 01-1 1h-3M6 14H3a1 1 0 01-1-1v-3"/></svg>
        </button>
        <div style={{ width: 1, height: 20, backgroundColor: theme.border, margin: '0 4px' }} />
        <button className="tbtn" data-tip="Undo" onClick={handleUndo} disabled={historyIndex <= 0}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l-3 3 3 3"/><path d="M1 9h10a4 4 0 000-8H8"/></svg>
        </button>
        <button className="tbtn" data-tip="Redo" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 6l3 3-3 3"/><path d="M15 9H5a4 4 0 010-8h3"/></svg>
        </button>
        {collidingIds.length > 0 && (
          <div style={{ padding: '3px 8px', backgroundColor: theme.danger, color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 600, marginLeft: 4 }}>
            ⚠ {collidingIds.length}
          </div>
        )}
      </div>

      {/* ── GUEST PANEL ── */}
      {showGuestPanel && (
        <aside
          className="glass"
          style={{
            position: 'absolute', top: 60, left: showFurniturePanel ? 264 : 12, width: 260, zIndex: 120,
            borderRadius: theme.radius, maxHeight: 'calc(100vh - 130px)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', animation: 'slideLeft 200ms ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px 8px', borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>Guests ({guests.length})</span>
            <button onClick={() => setShowGuestPanel(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: theme.textSecondary, lineHeight: 1, padding: 0 }}>×</button>
          </div>
          <div style={{ padding: '8px 14px', display: 'flex', gap: 6 }}>
            <button onClick={handleImportGuests} style={{ flex: 1, padding: 6, backgroundColor: theme.accent, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Import CSV</button>
            <button onClick={() => { const name = prompt('Guest name:'); if (name) handleAddGuest(name) }} style={{ flex: 1, padding: 6, backgroundColor: theme.accentLight, color: theme.accent, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Add</button>
          </div>
          <div style={{ padding: '0 14px 4px', fontSize: 10, color: theme.textSecondary }}>
            {Object.values(guestAssignments).flat().length} / {guests.length} assigned
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
            {guests.map(guest => {
              const assignedTo = Object.entries(guestAssignments).find(([, gs]) => gs.includes(guest))
              const assignedTableNum = assignedTo ? tableNumbers[assignedTo[0]] : undefined
              return (
                <div key={guest} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', backgroundColor: assignedTo ? 'rgba(0,51,102,0.04)' : 'transparent', borderRadius: 6, marginBottom: 2 }}>
                  <span style={{ flex: 1, fontSize: 11, color: theme.text }}>{guest}</span>
                  {assignedTableNum !== undefined && (
                    <span style={{ fontSize: 9, color: theme.accent, fontWeight: 600 }}>T#{assignedTableNum}</span>
                  )}
                  <select
                    value={assignedTo?.[0] ?? ''}
                    onChange={(e) => e.target.value ? handleAssignGuest(guest, e.target.value) : handleUnassignGuest(guest)}
                    style={{ width: 60, padding: 2, fontSize: 10, border: `1px solid ${theme.border}`, borderRadius: 4, background: 'rgba(255,255,255,0.6)' }}
                  >
                    <option value="">--</option>
                    {furniture.filter(i => { const t = furnitureTemplates.find(tpl => i.id.startsWith(tpl.id + '-')); return t && t.type === 'table' }).map(table => (
                      <option key={table.id} value={table.id}>#{tableNumbers[table.id]}</option>
                    ))}
                  </select>
                  <button onClick={() => handleRemoveGuest(guest)} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>×</button>
                </div>
              )
            })}
          </div>
        </aside>
      )}

      {/* ── MINI MAP + FLOOR LEVEL ── */}
      {showMiniMap && (
        <div
          className="glass"
          style={{
            position: 'absolute', bottom: 68, left: 12, zIndex: 120,
            borderRadius: theme.radius, padding: 10, animation: 'fadeIn 200ms ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: theme.text }}>Floor Plan</span>
            <button onClick={() => setShowMiniMap(false)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: theme.textSecondary, lineHeight: 1, padding: 0 }}>×</button>
          </div>
          <CADView
            furniture={furniture}
            onFurnitureMove={handleFurnitureMove}
            roomDimensions={roomDimensions}
            tableNumbers={tableNumbers}
            width={240}
            height={180}
          />
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 10, color: theme.textSecondary, fontWeight: 600 }}>Floor Y</label>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={floorLevelY}
              onChange={(e) => setFloorLevelY(Number(e.target.value))}
              style={{ flex: 1, accentColor: theme.accent }}
            />
            <span style={{ fontSize: 10, color: theme.text, minWidth: 28, textAlign: 'right' }}>{floorLevelY.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* ── COPY FROM PANEL ── */}
      {showCopyFrom && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.3)' }} onClick={() => setShowCopyFrom(false)} />
          <div
            className="glass"
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              zIndex: 200, minWidth: 280, borderRadius: theme.radius, overflow: 'hidden',
              animation: 'fadeIn 200ms ease',
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>Copy Layout From</span>
              <button onClick={() => setShowCopyFrom(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: theme.textSecondary, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {venues.map(v => (
                <div key={v.id}>
                  <div style={{ padding: '6px 16px', fontWeight: 600, color: theme.accent, fontSize: 11, backgroundColor: 'rgba(0,51,102,0.03)', borderBottom: `1px solid ${theme.border}` }}>{v.name}</div>
                  {v.locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleCopyLayout(v.id, loc.id)}
                      disabled={v.id === selectedVenue.id && loc.id === selectedLocation.id}
                      style={{
                        display: 'block', width: '100%', padding: '8px 16px 8px 28px', border: 'none',
                        backgroundColor: 'transparent', textAlign: 'left', fontSize: 12,
                        color: v.id === selectedVenue.id && loc.id === selectedLocation.id ? '#aaa' : theme.text,
                        cursor: v.id === selectedVenue.id && loc.id === selectedLocation.id ? 'default' : 'pointer',
                        transition: 'background 150ms',
                      }}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
