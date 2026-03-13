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
  previewImage?: string
}

const furnitureTemplates: FurnitureTemplate[] = [
  { id: 'round-table-6', name: 'Round Table (6)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 1.5, depth: 1.5, height: 0.75 }, seats: 6 },
  { id: 'round-table-8', name: 'Round Table (8)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 1.8, depth: 1.8, height: 0.75 }, seats: 8 },
  { id: 'round-table-10', name: 'Round Table (10)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 2.2, depth: 2.2, height: 0.75 }, seats: 10 },
  { id: 'rectangular-table', name: 'Rectangular Table', type: 'table', shape: 'rectangular-table', icon: '🪑', dimensions: { width: 2.0, depth: 1.0, height: 0.75 }, seats: 8 },
  { id: 'high-top-table', name: 'High-top Table', type: 'table', shape: 'high-top', icon: '🪑', dimensions: { width: 0.9, depth: 0.9, height: 1.1 }, seats: 4 },
  { id: 'standing-table', name: 'Standing Table', type: 'table', shape: 'standing-table', icon: '🪑', dimensions: { width: 0.5, depth: 0.5, height: 1.0 }, seats: 0 },
  { id: 'chair', name: 'Chair', type: 'chair', shape: 'chair', icon: '🪑', dimensions: { width: 0.5, depth: 0.5, height: 0.9 }, seats: 1 },
  { id: 'bar-stool', name: 'Bar Stool', type: 'chair', shape: 'bar-stool', icon: '🪑', dimensions: { width: 0.4, depth: 0.4, height: 1.1 }, seats: 1 },
  { id: 'sofa', name: 'Sofa', type: 'decoration', shape: 'sofa', icon: '🛋️', dimensions: { width: 2.0, depth: 0.9, height: 0.85 }, seats: 3 },
  { id: 'lounge', name: 'Lounge Bench', type: 'decoration', shape: 'lounge', icon: '🛋️', dimensions: { width: 1.5, depth: 0.7, height: 0.5 }, seats: 2 },
  { id: 'stage', name: 'Stage', type: 'stage', shape: 'stage', icon: '🎭', dimensions: { width: 3.0, depth: 2.0, height: 0.35 }, seats: 0 },
  { id: 'stage-large', name: 'Stage (Large)', type: 'stage', shape: 'stage', icon: '🎭', dimensions: { width: 5.0, depth: 3.0, height: 0.4 }, seats: 0 },
  { id: 'bar', name: 'Bar Counter', type: 'bar', shape: 'bar', icon: '🍸', dimensions: { width: 3.0, depth: 0.8, height: 1.1 }, seats: 0 },
  { id: 'bar-short', name: 'Bar (Short)', type: 'bar', shape: 'bar', icon: '🍸', dimensions: { width: 1.8, depth: 0.7, height: 1.1 }, seats: 0 },
  { id: 'podium', name: 'Podium', type: 'decoration', shape: 'podium', icon: '🎤', dimensions: { width: 0.6, depth: 0.5, height: 1.0 }, seats: 0 },
  { id: 'plant', name: 'Plant', type: 'decoration', shape: 'plant', icon: '🪴', dimensions: { width: 0.4, depth: 0.4, height: 1.0 }, seats: 0 },
  { id: 'plant-small', name: 'Plant (Small)', type: 'decoration', shape: 'plant', icon: '🪴', dimensions: { width: 0.3, depth: 0.3, height: 0.6 }, seats: 0 },
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
  width: canvasWidth = 300,
  height: canvasHeight = 300
}: {
  furniture: FurnitureItem[]
  onFurnitureMove: (id: string, x: number, z: number) => void
  roomDimensions: { width: number; depth: number }
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
      })
    }
    draw()
  }, [furniture, roomDimensions])

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
        style={{ border: '2px solid #003366', backgroundColor: '#f5f5f5', cursor: dragging ? 'grabbing' : 'grab', borderRadius: '4px', display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: '10px', color: '#003366', fontWeight: 600, backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '2px 6px', borderRadius: '3px', border: '1px solid #ddd' }}>
        Drag items to move
      </div>
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

  // Auto-save furniture & floorLevelY to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(saveKey, JSON.stringify({ furniture, floorLevelY }))
      } catch { /* quota exceeded — silent fail */ }
    }, 500)
    return () => clearTimeout(timer)
  }, [furniture, floorLevelY, saveKey])

  // Load layout when location changes + initialize history
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

  // Load from URL on mount
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
    } catch { /* invalid share link — ignore */ }
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
    for (const item of furniture) {
      const tpl = furnitureTemplates.find(t => item.id.startsWith(t.id + '-') || item.id === t.id)
      if (!tpl) continue
      totalSeats += tpl.seats
      if (tpl.type === 'table') tableCount++
      if (tpl.type === 'chair') chairCount++
    }
    return { totalSeats, tableCount, chairCount }
  })()

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

  const handleDragStart = (e: React.DragEvent, template: FurnitureTemplate) => {
    setSelectedTemplate(template)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'copy'
  }

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

  const handleRotateFurniture = (id: string) => {
    updateFurniture(furniture.map(item =>
      item.id === id ? { ...item, rotation: (item.rotation + Math.PI / 2) % (Math.PI * 2) } : item
    ))
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

  // Keyboard shortcuts
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

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', backgroundColor: '#003366', borderBottom: '3px solid #FFC72C', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/images/coe-logo.svg" alt="City of Edmonton" style={{ height: '56px', width: 'auto', display: 'block' }} />
          <h1 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 600 }}>3D Layout Designer</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="venue-select" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Venue</label>
            <select
              id="venue-select"
              value={selectedVenue.id}
              onChange={(e) => handleVenueChange(e.target.value)}
              style={{ padding: '6px 10px', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', minWidth: '140px' }}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="location-select" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Location</label>
            <select
              id="location-select"
              value={selectedLocation.id}
              onChange={(e) => handleLocationChange(e.target.value)}
              style={{ padding: '6px 10px', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', minWidth: '140px' }}
            >
              {selectedVenue.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) setPanoramaImage(URL.createObjectURL(file))
              }
              input.click()
            }}
            style={{ padding: '8px 16px', backgroundColor: '#FFC72C', color: '#003366', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            Load Panorama
          </button>
          <button
            onClick={() => setFurniture([])}
            style={{ padding: '8px 16px', backgroundColor: '#fff', color: '#003366', border: '2px solid #fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            Clear All
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '8px 16px', backgroundColor: saveConfirmation ? '#48bb78' : '#FFC72C', color: saveConfirmation ? '#fff' : '#003366', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, transition: 'background-color 0.2s' }}
          >
            {saveConfirmation ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={handleReset}
            style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            Reset
          </button>
          <button
            onClick={handleExport}
            style={{ padding: '8px 16px', backgroundColor: '#fff', color: '#003366', border: '2px solid #fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            Export
          </button>
          <button
            onClick={handleExportFloorPlan}
            style={{ padding: '8px 16px', backgroundColor: '#fff', color: '#003366', border: '2px solid #fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            Floor Plan
          </button>
          <button
            onClick={handleShare}
            style={{ padding: '8px 16px', backgroundColor: '#FFC72C', color: '#003366', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            Share
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCopyFrom(prev => !prev)}
              style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              Copy From...
            </button>
            {showCopyFrom && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 200, maxHeight: '300px', overflowY: 'auto', minWidth: '220px' }}>
                {venues.map(v => (
                  <div key={v.id}>
                    <div style={{ padding: '6px 12px', fontWeight: 600, color: '#003366', fontSize: '12px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>{v.name}</div>
                    {v.locations.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => handleCopyLayout(v.id, loc.id)}
                        disabled={v.id === selectedVenue.id && loc.id === selectedLocation.id}
                        style={{ display: 'block', width: '100%', padding: '6px 12px 6px 24px', border: 'none', backgroundColor: 'transparent', cursor: v.id === selectedVenue.id && loc.id === selectedLocation.id ? 'default' : 'pointer', textAlign: 'left', fontSize: '12px', color: v.id === selectedVenue.id && loc.id === selectedLocation.id ? '#aaa' : '#333' }}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#1a1a1a' }} onDragOver={handleDragOver} onDrop={handleDrop}>
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
          />
          {isDragging && selectedTemplate && (
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', color: '#003366', textAlign: 'center', backgroundColor: '#FFC72C', padding: '12px 24px', borderRadius: '8px', zIndex: 100, pointerEvents: 'none', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              Click on the floor to place {selectedTemplate.name}
            </div>
          )}
          {furniture.length === 0 && !isDragging && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', textAlign: 'center', backgroundColor: 'rgba(0, 51, 102, 0.9)', padding: '24px 32px', borderRadius: '8px', maxWidth: '320px', border: '2px solid #FFC72C' }}>
              <p style={{ margin: 0, fontSize: '16px' }}>Click furniture from the sidebar to place it</p>
              <p style={{ fontSize: '14px', marginTop: '12px', opacity: 0.9 }}>Use mouse to rotate, zoom, and pan the view</p>
            </div>
          )}
        </div>

        <div style={{ width: '260px', backgroundColor: '#fff', borderLeft: '1px solid #ddd', padding: '16px', overflowY: 'auto', boxShadow: '-2px 0 8px rgba(0,0,0,0.06)' }}>
          <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #003366' }}>
            <div style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Space</div>
            <div style={{ color: '#003366', fontWeight: 700, fontSize: '15px' }}>{selectedVenue.name}</div>
            <div style={{ color: '#555', fontSize: '14px' }}>{selectedLocation.name}</div>
            <div style={{ color: '#777', fontSize: '12px', marginTop: '4px' }}>{roomDimensions.width}m × {roomDimensions.depth}m</div>
          </div>
          <h3 style={{ color: '#003366', marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Furniture Library</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {furnitureTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                style={{
                  padding: '12px',
                  backgroundColor: selectedTemplate?.id === template.id ? '#003366' : '#f5f5f5',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: selectedTemplate?.id === template.id ? '2px solid #FFC72C' : '1px solid #e0e0e0',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{template.icon}</span>
                  <div>
                    <div style={{ color: selectedTemplate?.id === template.id ? '#fff' : '#333', fontWeight: 600, fontSize: '14px' }}>{template.name}</div>
                    <div style={{ color: selectedTemplate?.id === template.id ? 'rgba(255,255,255,0.8)' : '#666', fontSize: '12px' }}>{template.dimensions.width}m × {template.dimensions.depth}m</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {furniture.length > 0 && (
            <div style={{ marginTop: '16px', padding: '10px 12px', backgroundColor: '#edf2f7', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginBottom: '6px', fontWeight: 600 }}>Capacity</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#003366', fontWeight: 700 }}>{capacityInfo.totalSeats} seats</span>
                <span style={{ color: '#555' }}>{capacityInfo.tableCount} tables</span>
                <span style={{ color: '#555' }}>{capacityInfo.chairCount} chairs</span>
              </div>
            </div>
          )}
          {furniture.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ color: '#003366', margin: 0, fontSize: '16px', fontWeight: 600 }}>Placed Items ({furniture.length})</h3>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setSelectedItemIds(furniture.map(i => i.id))}
                    style={{ padding: '3px 8px', backgroundColor: '#003366', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedItemIds([])}
                    style={{ padding: '3px 8px', backgroundColor: '#e2e8f0', color: '#333', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                  >
                    Deselect
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {furniture.map((item) => {
                  const template = furnitureTemplates.find(t => item.id.startsWith(t.id + '-'))
                  return (
                    <div key={item.id} style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #e0e0e0', borderLeft: selectedItemIds.includes(item.id) ? '3px solid #003366' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ color: '#333', fontSize: '14px', fontWeight: 600 }}>{template?.name || 'Unknown'}</div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleDeleteFurniture(item.id)} style={{ padding: '4px 8px', backgroundColor: '#c53030', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }} title="Remove">×</button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', alignItems: 'center' }}>
                        <div>
                          <label style={{ display: 'block', color: '#666', fontSize: '10px', marginBottom: '2px' }}>X</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={getPositionInputValue(item, 0)}
                            onChange={(e) => setPositionInputValue(item.id, 0, e.target.value)}
                            onBlur={(e) => commitPositionInput(item.id, 0, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && commitPositionInput(item.id, 0, (e.target as HTMLInputElement).value)}
                            placeholder="0"
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '3px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: '#666', fontSize: '10px', marginBottom: '2px' }}>Y</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={getPositionInputValue(item, 1)}
                            onChange={(e) => setPositionInputValue(item.id, 1, e.target.value)}
                            onBlur={(e) => commitPositionInput(item.id, 1, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && commitPositionInput(item.id, 1, (e.target as HTMLInputElement).value)}
                            placeholder="0"
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '3px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: '#666', fontSize: '10px', marginBottom: '2px' }}>Z</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={getPositionInputValue(item, 2)}
                            onChange={(e) => setPositionInputValue(item.id, 2, e.target.value)}
                            onBlur={(e) => commitPositionInput(item.id, 2, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && commitPositionInput(item.id, 2, (e.target as HTMLInputElement).value)}
                            placeholder="0"
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '3px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <label style={{ color: '#666', fontSize: '10px' }}>Rot°</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={getRotationInputValue(item)}
                          onChange={(e) => setRotationInputValue(item.id, e.target.value)}
                          onBlur={(e) => commitRotationInput(item.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && commitRotationInput(item.id, (e.target as HTMLInputElement).value)}
                          style={{ width: '50px', padding: '3px 5px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '3px' }}
                        />
                        <button onClick={() => updateFurniture(furniture.map(i => i.id === item.id ? { ...i, rotation: i.rotation + Math.PI / 4 } : i))} style={{ padding: '3px 6px', backgroundColor: '#003366', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }} title="Rotate 45°">+45°</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div style={{ marginTop: '16px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '10px', color: '#666' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: '#003366' }}>Shortcuts</div>
            <div>Ctrl+Z — Undo</div>
            <div>Ctrl+Shift+Z — Redo</div>
            <div>Ctrl+D — Duplicate</div>
            <div>Delete — Remove selected</div>
            <div>Arrow keys — Nudge</div>
            <div>Escape — Deselect</div>
            <div>Shift+Click — Multi-select</div>
          </div>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          height: '132px',
          backgroundColor: '#fff',
          borderTop: '2px solid #003366',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '0 16px 0 20px',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CADView
            furniture={furniture}
            onFurnitureMove={handleFurnitureMove}
            roomDimensions={roomDimensions}
            width={420}
            height={110}
          />
          <div style={{ color: '#666', fontSize: '12px', maxWidth: '140px' }}>
            <strong style={{ color: '#003366' }}>Floor plan</strong> — Drag items here to move them on the floor. Adjust floor level below so they align with the room.
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', minWidth: '280px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', color: '#003366', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Floor level (Y)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={floorLevelY}
                onChange={(e) => setFloorLevelY(Number(e.target.value))}
                style={{ width: '120px', accentColor: '#003366' }}
              />
              <span style={{ color: '#333', fontSize: '12px', minWidth: '36px' }}>{floorLevelY.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Room: {roomDimensions.width}m × {roomDimensions.depth}m
          </div>
          <div style={{ fontSize: '12px', color: '#003366', fontWeight: 600 }}>
            {capacityInfo.totalSeats} seats
          </div>
          <button
            onClick={() => setSnapToGrid(prev => !prev)}
            style={{
              padding: '6px 12px',
              backgroundColor: snapToGrid ? '#003366' : '#e2e8f0',
              color: snapToGrid ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Snap {snapToGrid ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowLabels(prev => !prev)}
            style={{
              padding: '6px 12px',
              backgroundColor: showLabels ? '#003366' : '#e2e8f0',
              color: showLabels ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Labels {showLabels ? 'ON' : 'OFF'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setMeasureMode(prev => !prev)}
              style={{
                padding: '6px 12px',
                backgroundColor: measureMode ? '#003366' : '#e2e8f0',
                color: measureMode ? '#fff' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              Measure {measureMode ? 'ON' : 'OFF'}
            </button>
            {lastMeasurement !== null && (
              <span style={{ fontSize: '12px', color: '#003366', fontWeight: 600 }}>{lastMeasurement.toFixed(2)}m</span>
            )}
          </div>
          <button
            onClick={() => setZoomToFitTrigger(prev => prev + 1)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#e2e8f0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Zoom Fit
          </button>
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            style={{
              padding: '6px 12px',
              backgroundColor: historyIndex <= 0 ? '#e2e8f0' : '#003366',
              color: historyIndex <= 0 ? '#aaa' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: historyIndex <= 0 ? 'default' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            style={{
              padding: '6px 12px',
              backgroundColor: historyIndex >= history.length - 1 ? '#e2e8f0' : '#003366',
              color: historyIndex >= history.length - 1 ? '#aaa' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: historyIndex >= history.length - 1 ? 'default' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Redo
          </button>
          {collidingIds.length > 0 && (
            <div style={{ padding: '4px 8px', backgroundColor: '#c53030', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
              ⚠ {collidingIds.length} overlapping
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
