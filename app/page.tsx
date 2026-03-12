'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  previewImage?: string
}

const furnitureTemplates: FurnitureTemplate[] = [
  // Tables
  { id: 'round-table-6', name: 'Round Table (6)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 1.5, depth: 1.5, height: 0.75 } },
  { id: 'round-table-8', name: 'Round Table (8)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 1.8, depth: 1.8, height: 0.75 } },
  { id: 'round-table-10', name: 'Round Table (10)', type: 'table', shape: 'round-table', icon: '🪑', dimensions: { width: 2.2, depth: 2.2, height: 0.75 } },
  { id: 'rectangular-table', name: 'Rectangular Table', type: 'table', shape: 'rectangular-table', icon: '🪑', dimensions: { width: 2.0, depth: 1.0, height: 0.75 } },
  { id: 'high-top-table', name: 'High-top Table', type: 'table', shape: 'high-top', icon: '🪑', dimensions: { width: 0.9, depth: 0.9, height: 1.1 } },
  { id: 'standing-table', name: 'Standing Table', type: 'table', shape: 'standing-table', icon: '🪑', dimensions: { width: 0.5, depth: 0.5, height: 1.0 } },
  // Chairs & seating
  { id: 'chair', name: 'Chair', type: 'chair', shape: 'chair', icon: '🪑', dimensions: { width: 0.5, depth: 0.5, height: 0.9 } },
  { id: 'bar-stool', name: 'Bar Stool', type: 'chair', shape: 'bar-stool', icon: '🪑', dimensions: { width: 0.4, depth: 0.4, height: 1.1 } },
  { id: 'sofa', name: 'Sofa', type: 'decoration', shape: 'sofa', icon: '🛋️', dimensions: { width: 2.0, depth: 0.9, height: 0.85 } },
  { id: 'lounge', name: 'Lounge Bench', type: 'decoration', shape: 'lounge', icon: '🛋️', dimensions: { width: 1.5, depth: 0.7, height: 0.5 } },
  // Stage & bar
  { id: 'stage', name: 'Stage', type: 'stage', shape: 'stage', icon: '🎭', dimensions: { width: 3.0, depth: 2.0, height: 0.35 } },
  { id: 'stage-large', name: 'Stage (Large)', type: 'stage', shape: 'stage', icon: '🎭', dimensions: { width: 5.0, depth: 3.0, height: 0.4 } },
  { id: 'bar', name: 'Bar Counter', type: 'bar', shape: 'bar', icon: '🍸', dimensions: { width: 3.0, depth: 0.8, height: 1.1 } },
  { id: 'bar-short', name: 'Bar (Short)', type: 'bar', shape: 'bar', icon: '🍸', dimensions: { width: 1.8, depth: 0.7, height: 1.1 } },
  // Podium & decor
  { id: 'podium', name: 'Podium', type: 'decoration', shape: 'podium', icon: '🎤', dimensions: { width: 0.6, depth: 0.5, height: 1.0 } },
  { id: 'plant', name: 'Plant', type: 'decoration', shape: 'plant', icon: '🪴', dimensions: { width: 0.4, depth: 0.4, height: 1.0 } },
  { id: 'plant-small', name: 'Plant (Small)', type: 'decoration', shape: 'plant', icon: '🪴', dimensions: { width: 0.3, depth: 0.3, height: 0.6 } },
]

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

  useEffect(() => {
    setPanoramaImage(selectedLocation.panorama)
    setRoomDimensions(selectedLocation.roomDimensions)
    setFurniture(loadLocationLayout(selectedLocation))
  }, [selectedLocation])

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
    setFurniture([...furniture, newItem])
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
    setFurniture(prev => [...prev, newItem])
    setSelectedTemplate(null)
    setIsDragging(false)
  }

  const handleTemplateSelect = (template: FurnitureTemplate) => {
    setSelectedTemplate(template)
    setIsDragging(true)
  }

  const handleFurnitureMove = (id: string, x: number, z: number) => {
    setFurniture(furniture.map(item =>
      item.id === id ? { ...item, position: [x, item.position[1], z] } : item
    ))
  }

  const positionInputKey = (id: string, axis: number) => `${id}-${axis}`

  const handleFurniturePositionChange = (id: string, axis: 0 | 1 | 2, value: number) => {
    setFurniture(furniture.map(item => {
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

  const handleDeleteFurniture = (id: string) => {
    setFurniture(furniture.filter(item => item.id !== id))
  }

  const handleRotateFurniture = (id: string) => {
    setFurniture(furniture.map(item =>
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
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ color: '#003366', marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Placed Items ({furniture.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {furniture.map((item) => {
                  const template = furnitureTemplates.find(t => item.id.startsWith(t.id + '-'))
                  return (
                    <div key={item.id} style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ color: '#333', fontSize: '14px', fontWeight: 600 }}>{template?.name || 'Unknown'}</div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleRotateFurniture(item.id)} style={{ padding: '4px 8px', backgroundColor: '#003366', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }} title="Rotate">↻</button>
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
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', minWidth: '280px' }}>
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
        </div>
      </div>
    </div>
  )
}
