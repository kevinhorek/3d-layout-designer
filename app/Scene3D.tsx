'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useTexture, Html } from '@react-three/drei'
import * as THREE from 'three'

// Types
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
  previewImage?: string
}

interface Scene3DProps {
  furniture: FurnitureItem[]
  panoramaImage: string
  onFurnitureDrop: (position: [number, number, number]) => void
  isPlacing: boolean
  furnitureTemplates: FurnitureTemplate[]
  floorLevelY?: number
  selectedFurnitureIds?: string[]
  onFurnitureSelect?: (id: string | null, shiftKey?: boolean) => void
  onFurnitureMove?: (id: string, position: [number, number, number]) => void
  snapToGrid?: boolean
  gridSize?: number
  roomColor?: string
  roomDimensions?: { width: number; depth: number }
  wallHeight?: number
  showLabels?: boolean
  measureMode?: boolean
  onMeasureComplete?: (distance: number, points: [[number,number,number],[number,number,number]]) => void
  zoomToFitTrigger?: number
  collidingIds?: string[]
}

// 3D Scene Components
function PanoramicBackground({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl)
  const { scene } = useThree()

  useEffect(() => {
    const geometry = new THREE.SphereGeometry(50, 64, 32)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: true
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.renderOrder = -1000
    scene.add(mesh)

    return () => {
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
      texture.dispose()
    }
  }, [texture, scene])

  return null
}

class PanoramaErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    return this.state.hasError ? null : this.props.children
  }
}

function ColoredBackground({ color }: { color: string }) {
  return (
    <mesh renderOrder={-1001}>
      <sphereGeometry args={[51, 32, 16]} />
      <meshBasicMaterial color={color} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

const WOOD_COLOR = '#8B4513'
const WOOD_DARK = '#654321'
const METAL_COLOR = '#4A4A4A'
const FABRIC_COLOR = '#5C4033'
const STAGE_COLOR = '#3d3d3d'
const BAR_COLOR = '#2c1810'
const PLANT_POT = '#8B4513'
const PLANT_LEAF = '#228B22'

function RoundTableMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const radius = Math.min(w, d) / 2
  const topHeight = 0.08
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 1.02, topHeight, 32]} />
        <meshStandardMaterial color={WOOD_COLOR} metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, topHeight / 2 + 0.02, 0]}>
        <cylinderGeometry args={[radius * 0.12, radius * 0.2, h - topHeight - 0.04, 16]} />
        <meshStandardMaterial color={WOOD_DARK} metalness={0.15} roughness={0.85} />
      </mesh>
    </group>
  )
}

function RectangularTableMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const topThick = 0.06
  const legW = 0.08
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h - topThick / 2, 0]}>
        <boxGeometry args={[w, topThick, d]} />
        <meshStandardMaterial color={WOOD_COLOR} metalness={0.2} roughness={0.8} />
      </mesh>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => (
        <mesh key={i} castShadow receiveShadow position={[sx * (w / 2 - legW / 2), (h - topThick) / 2, sz * (d / 2 - legW / 2)]}>
          <boxGeometry args={[legW, h - topThick, legW]} />
          <meshStandardMaterial color={WOOD_DARK} metalness={0.15} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

function ChairMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const seatH = 0.45
  const legR = 0.025
  const backH = h - seatH - 0.02
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, seatH / 2, 0]}>
        <boxGeometry args={[w * 0.9, seatH * 0.25, d * 0.9]} />
        <meshStandardMaterial color={WOOD_COLOR} metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, seatH + backH / 2, -d * 0.4]}>
        <boxGeometry args={[w * 0.85, backH, 0.04]} />
        <meshStandardMaterial color={WOOD_COLOR} metalness={0.2} roughness={0.8} />
      </mesh>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => (
        <mesh key={i} castShadow receiveShadow position={[sx * (w / 2 - legR), seatH / 2, sz * (d / 2 - legR)]}>
          <cylinderGeometry args={[legR, legR * 1.1, seatH / 2, 12]} />
          <meshStandardMaterial color={WOOD_DARK} metalness={0.2} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function StageMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const trimH = 0.08
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={STAGE_COLOR} metalness={0.1} roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, h + trimH / 2, 0]}>
        <boxGeometry args={[w + 0.1, trimH, d + 0.1]} />
        <meshStandardMaterial color="#555" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  )
}

function BarMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const counterH = 0.06
  const backH = h * 0.4
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h - counterH / 2, 0]}>
        <boxGeometry args={[w, counterH, d]} />
        <meshStandardMaterial color={BAR_COLOR} metalness={0.15} roughness={0.85} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, (h - counterH) / 2, 0]}>
        <boxGeometry args={[w, h - counterH, d]} />
        <meshStandardMaterial color={WOOD_DARK} metalness={0.1} roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, h + backH / 2, -d * 0.3]}>
        <boxGeometry args={[w * 0.98, backH, 0.15]} />
        <meshStandardMaterial color={BAR_COLOR} metalness={0.2} roughness={0.8} />
      </mesh>
    </group>
  )
}

function SofaMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const seatH = h * 0.4
  const backH = h - seatH
  const armH = h * 0.7
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, seatH / 2, 0]}>
        <boxGeometry args={[w, seatH, d]} />
        <meshStandardMaterial color={FABRIC_COLOR} metalness={0} roughness={0.95} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, seatH + backH / 2, -d / 2 + 0.05]}>
        <boxGeometry args={[w, backH, 0.15]} />
        <meshStandardMaterial color={FABRIC_COLOR} metalness={0} roughness={0.95} />
      </mesh>
      <mesh castShadow receiveShadow position={[-w / 2 + 0.08, armH / 2, 0]}>
        <boxGeometry args={[0.12, armH, d]} />
        <meshStandardMaterial color={FABRIC_COLOR} metalness={0} roughness={0.95} />
      </mesh>
      <mesh castShadow receiveShadow position={[w / 2 - 0.08, armH / 2, 0]}>
        <boxGeometry args={[0.12, armH, d]} />
        <meshStandardMaterial color={FABRIC_COLOR} metalness={0} roughness={0.95} />
      </mesh>
    </group>
  )
}

function HighTopTableMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const r = Math.min(w, d) / 2
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h - 0.04, 0]}>
        <cylinderGeometry args={[r, r * 1.05, 0.08, 24]} />
        <meshStandardMaterial color={WOOD_COLOR} metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, (h - 0.08) / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.06, h - 0.08, 12]} />
        <meshStandardMaterial color={METAL_COLOR} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

function PodiumMesh({ w, h, d }: { w: number; h: number; d: number }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={WOOD_DARK} metalness={0.1} roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, h + 0.03, 0]}>
        <boxGeometry args={[w * 0.95, 0.04, d * 0.6]} />
        <meshStandardMaterial color={WOOD_COLOR} metalness={0.2} roughness={0.8} />
      </mesh>
    </group>
  )
}

function PlantMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const potH = h * 0.5
  const potR = Math.min(w, d) / 2 * 0.8
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, potH / 2, 0]}>
        <cylinderGeometry args={[potR * 1.1, potR, potH, 16]} />
        <meshStandardMaterial color={PLANT_POT} metalness={0.1} roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, potH + (h - potH) / 2, 0]}>
        <sphereGeometry args={[(h - potH) * 0.6, 12, 10]} />
        <meshStandardMaterial color={PLANT_LEAF} metalness={0} roughness={1} />
      </mesh>
    </group>
  )
}

function LoungeMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const seatH = h * 0.5
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, seatH / 2, 0]}>
        <boxGeometry args={[w, seatH, d]} />
        <meshStandardMaterial color={FABRIC_COLOR} metalness={0} roughness={0.95} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, seatH + (h - seatH) / 2, -d / 3]}>
        <boxGeometry args={[w, h - seatH, 0.12]} />
        <meshStandardMaterial color={FABRIC_COLOR} metalness={0} roughness={0.95} />
      </mesh>
    </group>
  )
}

function BarStoolMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const seatR = Math.min(w, d) / 2 * 0.9
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h - 0.05, 0]}>
        <cylinderGeometry args={[seatR, seatR * 1.05, 0.06, 20]} />
        <meshStandardMaterial color={WOOD_COLOR} metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, (h - 0.1) / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.03, h - 0.1, 10]} />
        <meshStandardMaterial color={METAL_COLOR} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.04, 12]} />
        <meshStandardMaterial color={METAL_COLOR} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

function StandingTableMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const r = Math.min(w, d) / 2
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h - 0.03, 0]}>
        <cylinderGeometry args={[r, r, 0.06, 24]} />
        <meshStandardMaterial color={WOOD_COLOR} metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, (h - 0.06) / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.04, h - 0.06, 10]} />
        <meshStandardMaterial color={METAL_COLOR} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

function SnapGrid({ gridSize = 0.5, roomDimensions }: { gridSize?: number; roomDimensions?: { width: number; depth: number } }) {
  const size = roomDimensions ? Math.max(roomDimensions.width, roomDimensions.depth) + 2 : 20
  const divisions = Math.round(size / gridSize)
  return (
    <gridHelper args={[size, divisions, '#4488ff', '#2244aa']} position={[0, 0.005, 0]} />
  )
}

function RoomBoundary({ width, depth, wallHeight = 3 }: { width: number; depth: number; wallHeight?: number }) {
  const walls = useMemo(() => {
    const hw = width / 2
    const hd = depth / 2
    return [
      { position: [0, wallHeight / 2, hd] as [number, number, number], size: [width, wallHeight, 0.05] as [number, number, number] },
      { position: [0, wallHeight / 2, -hd] as [number, number, number], size: [width, wallHeight, 0.05] as [number, number, number] },
      { position: [-hw, wallHeight / 2, 0] as [number, number, number], size: [0.05, wallHeight, depth] as [number, number, number] },
      { position: [hw, wallHeight / 2, 0] as [number, number, number], size: [0.05, wallHeight, depth] as [number, number, number] },
    ]
  }, [width, depth, wallHeight])

  const wallEdgeGeometries = useMemo(() =>
    walls.map(w => new THREE.EdgesGeometry(new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]))),
    [walls]
  )

  const floorDivisions = Math.max(Math.round(width), Math.round(depth)) * 2

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#666" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <gridHelper
        args={[Math.max(width, depth), floorDivisions, '#555555', '#444444']}
        position={[0, 0.01, 0]}
      />
      {walls.map((wall, i) => (
        <group key={i}>
          <mesh position={wall.position}>
            <boxGeometry args={wall.size} />
            <meshStandardMaterial
              color="#8888cc"
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <lineSegments position={wall.position} geometry={wallEdgeGeometries[i]}>
            <lineBasicMaterial color="#6666aa" transparent opacity={0.4} />
          </lineSegments>
        </group>
      ))}
    </group>
  )
}

function DragController({
  isDragging,
  selectedId,
  onMove,
  onDragEnd,
  snapToGrid: snap,
  gridSize = 0.5,
  floorY = 0
}: {
  isDragging: boolean
  selectedId: string | null
  onMove: (id: string, position: [number, number, number]) => void
  onDragEnd: () => void
  snapToGrid?: boolean
  gridSize?: number
  floorY?: number
}) {
  const { camera, raycaster, gl } = useThree()
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY), [floorY])

  useEffect(() => {
    if (!isDragging || !selectedId) return

    const handlePointerMove = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(mouse, camera)
      const target = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(floorPlane, target)) {
        let x = target.x
        let z = target.z
        if (snap) {
          x = Math.round(x / gridSize) * gridSize
          z = Math.round(z / gridSize) * gridSize
        }
        onMove(selectedId, [x, 0, z])
      }
    }

    const handlePointerUp = () => {
      onDragEnd()
    }

    gl.domElement.style.cursor = 'grabbing'
    gl.domElement.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      gl.domElement.style.cursor = 'default'
      gl.domElement.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging, selectedId, camera, raycaster, gl, onMove, onDragEnd, snap, gridSize, floorPlane])

  return null
}

function Furniture3D({
  item,
  template,
  floorLevelY = 0,
  isSelected,
  isColliding,
  onSelect,
  onDragStart,
  showLabel,
  labelText
}: {
  item: FurnitureItem
  template: FurnitureTemplate
  floorLevelY?: number
  isSelected?: boolean
  isColliding?: boolean
  onSelect?: (id: string, shiftKey?: boolean) => void
  onDragStart?: () => void
  showLabel?: boolean
  labelText?: string
}) {
  const meshRef = useRef<THREE.Group>(null)
  const contentRef = useRef<THREE.Group>(null)
  const { width, depth, height } = template.dimensions

  const scale = 2
  const scaledWidth = width * scale
  const scaledHeight = height * scale
  const scaledDepth = depth * scale
  const floorY = item.position[1] + floorLevelY
  const yPosition = floorY + scaledHeight / 2

  const meshProps = { w: scaledWidth, h: scaledHeight, d: scaledDepth }

  const [selectionEdges, setSelectionEdges] = useState<{
    geometry: THREE.EdgesGeometry
    center: [number, number, number]
  } | null>(null)

  useEffect(() => {
    if ((isSelected || isColliding) && contentRef.current && meshRef.current) {
      const box = new THREE.Box3().setFromObject(contentRef.current)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      meshRef.current.worldToLocal(center)
      const pad = 0.08
      const boxGeo = new THREE.BoxGeometry(
        size.x / item.scale + pad,
        size.y / item.scale + pad,
        size.z / item.scale + pad
      )
      const edges = new THREE.EdgesGeometry(boxGeo)
      boxGeo.dispose()
      setSelectionEdges({
        geometry: edges,
        center: [center.x, center.y, center.z]
      })
      return () => {
        edges.dispose()
      }
    } else {
      setSelectionEdges(null)
    }
  }, [isSelected, isColliding, item.scale])

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (isSelected && !e.shiftKey && onDragStart) {
      onDragStart()
    } else if (onSelect) {
      onSelect(item.id, e.shiftKey)
    }
  }, [isSelected, onDragStart, onSelect, item.id])

  const renderShape = () => {
    switch (template.shape) {
      case 'round-table':
        return <RoundTableMesh {...meshProps} />
      case 'rectangular-table':
        return <RectangularTableMesh {...meshProps} />
      case 'chair':
        return <ChairMesh {...meshProps} />
      case 'stage':
        return <StageMesh {...meshProps} />
      case 'bar':
        return <BarMesh {...meshProps} />
      case 'sofa':
        return <SofaMesh {...meshProps} />
      case 'high-top':
        return <HighTopTableMesh {...meshProps} />
      case 'podium':
        return <PodiumMesh {...meshProps} />
      case 'plant':
        return <PlantMesh {...meshProps} />
      case 'lounge':
        return <LoungeMesh {...meshProps} />
      case 'bar-stool':
        return <BarStoolMesh {...meshProps} />
      case 'standing-table':
        return <StandingTableMesh {...meshProps} />
      default: {
        const _: never = template.shape
        return <RectangularTableMesh {...meshProps} />
      }
    }
  }

  return (
    <group
      ref={meshRef}
      position={[item.position[0], yPosition, item.position[2]]}
      rotation={[0, item.rotation, 0]}
      scale={item.scale}
      onPointerDown={handlePointerDown}
    >
      <group ref={contentRef}>
        {renderShape()}
      </group>
      {isSelected && selectionEdges && (
        <lineSegments position={selectionEdges.center} geometry={selectionEdges.geometry}>
          <lineBasicMaterial color={isColliding ? '#ff4444' : '#ffff00'} linewidth={2} />
        </lineSegments>
      )}
      {!isSelected && isColliding && selectionEdges && (
        <lineSegments position={selectionEdges.center} geometry={selectionEdges.geometry}>
          <lineBasicMaterial color="#ff4444" linewidth={2} transparent opacity={0.6} />
        </lineSegments>
      )}
      {showLabel && labelText && (
        <Html
          position={[0, scaledHeight + 0.3, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(0,51,102,0.85)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,199,44,0.5)'
          }}>
            {labelText}
          </div>
        </Html>
      )}
    </group>
  )
}

function FloorPlane({
  onDrop,
  isPlacing,
  onFloorClick,
  snapToGrid: snap,
  gridSize = 0.5
}: {
  onDrop: (position: [number, number, number]) => void
  isPlacing: boolean
  onFloorClick?: () => void
  snapToGrid?: boolean
  gridSize?: number
}) {
  const { camera, raycaster, gl } = useThree()
  const planeRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!isPlacing) {
      gl.domElement.style.cursor = 'default'
      return
    }

    const handleClick = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (!planeRef.current) return

      const mouse = new THREE.Vector2()
      const rect = gl.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(planeRef.current)

      if (intersects.length > 0) {
        const point = intersects[0].point
        let x = point.x
        let z = point.z
        if (snap && gridSize) {
          x = Math.round(x / gridSize) * gridSize
          z = Math.round(z / gridSize) * gridSize
        }
        onDrop([x, point.y, z])
      }
    }

    gl.domElement.style.cursor = 'crosshair'
    gl.domElement.addEventListener('click', handleClick, { capture: true })
    return () => {
      gl.domElement.removeEventListener('click', handleClick, { capture: true })
      gl.domElement.style.cursor = 'default'
    }
  }, [camera, raycaster, gl, onDrop, isPlacing, snap, gridSize])

  return (
    <>
      <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} visible={false}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        onPointerDown={() => {
          if (!isPlacing && onFloorClick) onFloorClick()
        }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {isPlacing && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial
            color="#888888"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  )
}

function MeasureLine({ start, end }: { start: [number,number,number]; end: [number,number,number] }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...start, ...end], 3))
    return geo
  }, [start, end])

  const lineObj = useMemo(
    () => new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#ff4444' })),
    [geometry]
  )

  return <primitive object={lineObj} />
}

function MeasureTool({ active, onComplete }: {
  active: boolean
  onComplete?: (distance: number, points: [[number,number,number],[number,number,number]]) => void
}) {
  const { camera, raycaster, gl } = useThree()
  const [points, setPoints] = useState<[number,number,number][]>([])
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))

  useEffect(() => {
    if (!active) {
      setPoints([])
      return
    }

    const handleClick = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(mouse, camera)
      const target = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(planeRef.current, target)) {
        setPoints(prev => {
          const p: [number,number,number] = [target.x, target.y, target.z]
          if (prev.length === 0) return [p]
          if (prev.length === 1) {
            const dist = Math.sqrt(
              Math.pow(prev[0][0] - p[0], 2) + Math.pow(prev[0][2] - p[2], 2)
            )
            onComplete?.(dist, [prev[0] as [number,number,number], p])
            return [prev[0], p]
          }
          return [p]
        })
      }
    }

    gl.domElement.style.cursor = 'crosshair'
    gl.domElement.addEventListener('click', handleClick)
    return () => {
      gl.domElement.removeEventListener('click', handleClick)
      gl.domElement.style.cursor = 'default'
    }
  }, [active, camera, raycaster, gl, onComplete])

  if (points.length === 0) return null

  return (
    <group>
      <mesh position={points[0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#ff4444" />
      </mesh>
      {points.length === 2 && (
        <>
          <mesh position={points[1]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#ff4444" />
          </mesh>
          <MeasureLine
            start={points[0] as [number,number,number]}
            end={points[1] as [number,number,number]}
          />
          <Html
            position={[
              (points[0][0] + points[1][0]) / 2,
              (points[0][1] + points[1][1]) / 2 + 0.3,
              (points[0][2] + points[1][2]) / 2
            ]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              background: 'rgba(204,0,0,0.9)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}>
              {Math.sqrt(
                Math.pow(points[0][0] - points[1][0], 2) +
                Math.pow(points[0][2] - points[1][2], 2)
              ).toFixed(2)}m
            </div>
          </Html>
        </>
      )}
    </group>
  )
}

function ZoomToFit({ trigger, furniture, roomDimensions }: {
  trigger?: number
  furniture: FurnitureItem[]
  roomDimensions?: { width: number; depth: number }
}) {
  const { camera } = useThree()
  const lastTrigger = useRef(trigger)

  useEffect(() => {
    if (trigger === undefined || trigger === lastTrigger.current) return
    lastTrigger.current = trigger

    const dim = roomDimensions ?? { width: 10, depth: 10 }
    const maxDim = Math.max(dim.width, dim.depth)
    const distance = maxDim * 0.8

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, distance * 0.7, distance * 0.7)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }
  }, [trigger, camera, furniture, roomDimensions])

  return null
}

function Scene3D({
  furniture,
  panoramaImage,
  onFurnitureDrop,
  isPlacing,
  furnitureTemplates,
  floorLevelY = 0,
  selectedFurnitureIds = [],
  onFurnitureSelect,
  onFurnitureMove,
  snapToGrid: snap,
  gridSize = 0.5,
  roomColor,
  roomDimensions,
  wallHeight = 3,
  showLabels,
  measureMode,
  onMeasureComplete,
  zoomToFitTrigger,
  collidingIds
}: Scene3DProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleSelect = useCallback((id: string, shiftKey?: boolean) => {
    onFurnitureSelect?.(id, shiftKey)
  }, [onFurnitureSelect])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleFloorClick = useCallback(() => {
    if (!isPlacing && onFurnitureSelect) {
      onFurnitureSelect(null)
    }
  }, [isPlacing, onFurnitureSelect])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.6, 3]} fov={75} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.5}
        maxDistance={20}
        enabled={!isPlacing && !isDragging && !measureMode}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.6} />
      <pointLight position={[0, 5, 0]} intensity={0.4} />

      {roomColor && <ColoredBackground color={roomColor} />}

      <PanoramaErrorBoundary>
        <Suspense fallback={null}>
          <PanoramicBackground imageUrl={panoramaImage} />
        </Suspense>
      </PanoramaErrorBoundary>

      <FloorPlane
        onDrop={onFurnitureDrop}
        isPlacing={isPlacing}
        onFloorClick={handleFloorClick}
        snapToGrid={snap}
        gridSize={gridSize}
      />

      {snap && <SnapGrid gridSize={gridSize} roomDimensions={roomDimensions} />}

      {roomDimensions && (
        <RoomBoundary width={roomDimensions.width} depth={roomDimensions.depth} wallHeight={wallHeight} />
      )}

      {onFurnitureMove && (
        <DragController
          isDragging={isDragging}
          selectedId={selectedFurnitureIds.length === 1 ? selectedFurnitureIds[0] : null}
          onMove={onFurnitureMove}
          onDragEnd={handleDragEnd}
          snapToGrid={snap}
          gridSize={gridSize}
          floorY={floorLevelY}
        />
      )}

      {furniture.map((item) => {
        const template = furnitureTemplates.find(t => item.id.startsWith(t.id + '-'))
        if (!template) return null
        return (
          <Furniture3D
            key={item.id}
            item={item}
            template={template}
            floorLevelY={floorLevelY}
            isSelected={selectedFurnitureIds.includes(item.id)}
            isColliding={collidingIds?.includes(item.id) ?? false}
            onSelect={handleSelect}
            onDragStart={handleDragStart}
            showLabel={showLabels}
            labelText={template.name}
          />
        )
      })}

      <MeasureTool active={measureMode ?? false} onComplete={onMeasureComplete} />
      <ZoomToFit trigger={zoomToFitTrigger} furniture={furniture} roomDimensions={roomDimensions} />
    </>
  )
}

export function Scene3DCanvas(props: Scene3DProps) {
  return (
    <Canvas
      gl={{
        alpha: false,
        antialias: true,
        depth: true,
        stencil: false
      }}
      camera={{ position: [0, 1.6, 3], fov: 75 }}
    >
      <Scene3D {...props} />
    </Canvas>
  )
}

export default Scene3DCanvas
