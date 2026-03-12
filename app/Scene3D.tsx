'use client'

import React, { useRef, useEffect, Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei'
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

function Furniture3D({ item, template }: { item: FurnitureItem; template: FurnitureTemplate }) {
  const meshRef = useRef<THREE.Group>(null)
  const { width, depth, height } = template.dimensions

  const scale = 2
  const scaledWidth = width * scale
  const scaledHeight = height * scale
  const scaledDepth = depth * scale
  const floorY = item.position[1]
  const yPosition = floorY + scaledHeight / 2

  const meshProps = { w: scaledWidth, h: scaledHeight, d: scaledDepth }

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
    >
      {renderShape()}
    </group>
  )
}

function FloorPlane({
  onDrop,
  isPlacing
}: {
  onDrop: (position: [number, number, number]) => void
  isPlacing: boolean
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
        onDrop([point.x, point.y, point.z])
      }
    }

    gl.domElement.style.cursor = 'crosshair'
    gl.domElement.addEventListener('click', handleClick, { capture: true })
    return () => {
      gl.domElement.removeEventListener('click', handleClick, { capture: true })
      gl.domElement.style.cursor = 'default'
    }
  }, [camera, raycaster, gl, onDrop, isPlacing])

  return (
    <>
      <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} visible={false}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
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

function Scene3D({
  furniture,
  panoramaImage,
  onFurnitureDrop,
  isPlacing,
  furnitureTemplates
}: Scene3DProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.6, 3]} fov={75} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.5}
        maxDistance={20}
        enabled={!isPlacing}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.6} />
      <pointLight position={[0, 5, 0]} intensity={0.4} />

      <Suspense fallback={null}>
        <PanoramicBackground imageUrl={panoramaImage} />
      </Suspense>

      <FloorPlane onDrop={onFurnitureDrop} isPlacing={isPlacing} />

      {furniture.map((item) => {
        const template = furnitureTemplates.find(t => item.id.startsWith(t.id + '-'))
        if (!template) return null
        return <Furniture3D key={item.id} item={item} template={template} />
      })}
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
