import React from 'react'
import type { FurnitureItem, FurnitureTemplate, FurnitureShape } from '../data/venueData'

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
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 1.02, 0.08, 32]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      <mesh position={[0, 0.04 + 0.02, 0]}>
        <cylinderGeometry args={[radius * 0.12, radius * 0.2, h - 0.12, 16]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
    </group>
  )
}

function RectangularTableMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const topThick = 0.06
  const legW = 0.08
  return (
    <group>
      <mesh position={[0, h - topThick / 2, 0]}>
        <boxGeometry args={[w, topThick, d]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - legW / 2), (h - topThick) / 2, sz * (d / 2 - legW / 2)]}>
          <boxGeometry args={[legW, h - topThick, legW]} />
          <meshStandardMaterial color={WOOD_DARK} />
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
      <mesh position={[0, seatH / 2, 0]}>
        <boxGeometry args={[w * 0.9, seatH * 0.25, d * 0.9]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      <mesh position={[0, seatH + backH / 2, -d * 0.4]}>
        <boxGeometry args={[w * 0.85, backH, 0.04]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - legR), seatH / 2, sz * (d / 2 - legR)]}>
          <cylinderGeometry args={[legR, legR * 1.1, seatH / 2, 8]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
    </group>
  )
}

function StageMesh({ w, h, d }: { w: number; h: number; d: number }) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={STAGE_COLOR} />
      </mesh>
      <mesh position={[0, h + 0.04, 0]}>
        <boxGeometry args={[w + 0.1, 0.08, d + 0.1]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  )
}

function BarMesh({ w, h, d }: { w: number; h: number; d: number }) {
  return (
    <group>
      <mesh position={[0, h - 0.03, 0]}>
        <boxGeometry args={[w, 0.06, d]} />
        <meshStandardMaterial color={BAR_COLOR} />
      </mesh>
      <mesh position={[0, (h - 0.06) / 2, 0]}>
        <boxGeometry args={[w, h - 0.06, d]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      <mesh position={[0, h + h * 0.2, -d * 0.3]}>
        <boxGeometry args={[w * 0.98, h * 0.4, 0.15]} />
        <meshStandardMaterial color={BAR_COLOR} />
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
      <mesh position={[0, seatH / 2, 0]}><boxGeometry args={[w, seatH, d]} /><meshStandardMaterial color={FABRIC_COLOR} /></mesh>
      <mesh position={[0, seatH + backH / 2, -d / 2 + 0.05]}><boxGeometry args={[w, backH, 0.15]} /><meshStandardMaterial color={FABRIC_COLOR} /></mesh>
      <mesh position={[-w / 2 + 0.08, armH / 2, 0]}><boxGeometry args={[0.12, armH, d]} /><meshStandardMaterial color={FABRIC_COLOR} /></mesh>
      <mesh position={[w / 2 - 0.08, armH / 2, 0]}><boxGeometry args={[0.12, armH, d]} /><meshStandardMaterial color={FABRIC_COLOR} /></mesh>
    </group>
  )
}

function HighTopTableMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const r = Math.min(w, d) / 2
  return (
    <group>
      <mesh position={[0, h - 0.04, 0]}><cylinderGeometry args={[r, r * 1.05, 0.08, 24]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>
      <mesh position={[0, (h - 0.08) / 2, 0]}><cylinderGeometry args={[0.04, 0.06, h - 0.08, 12]} /><meshStandardMaterial color={METAL_COLOR} /></mesh>
    </group>
  )
}

function PodiumMesh({ w, h, d }: { w: number; h: number; d: number }) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
      <mesh position={[0, h + 0.03, 0]}><boxGeometry args={[w * 0.95, 0.04, d * 0.6]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>
    </group>
  )
}

function PlantMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const potH = h * 0.5
  const potR = Math.min(w, d) / 2 * 0.8
  return (
    <group>
      <mesh position={[0, potH / 2, 0]}><cylinderGeometry args={[potR * 1.1, potR, potH, 16]} /><meshStandardMaterial color={PLANT_POT} /></mesh>
      <mesh position={[0, potH + (h - potH) / 2, 0]}><sphereGeometry args={[(h - potH) * 0.6, 12, 10]} /><meshStandardMaterial color={PLANT_LEAF} /></mesh>
    </group>
  )
}

function LoungeMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const seatH = h * 0.5
  return (
    <group>
      <mesh position={[0, seatH / 2, 0]}><boxGeometry args={[w, seatH, d]} /><meshStandardMaterial color={FABRIC_COLOR} /></mesh>
      <mesh position={[0, seatH + (h - seatH) / 2, -d / 3]}><boxGeometry args={[w, h - seatH, 0.12]} /><meshStandardMaterial color={FABRIC_COLOR} /></mesh>
    </group>
  )
}

function BarStoolMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const seatR = Math.min(w, d) / 2 * 0.9
  return (
    <group>
      <mesh position={[0, h - 0.05, 0]}><cylinderGeometry args={[seatR, seatR * 1.05, 0.06, 20]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>
      <mesh position={[0, (h - 0.1) / 2, 0]}><cylinderGeometry args={[0.02, 0.03, h - 0.1, 10]} /><meshStandardMaterial color={METAL_COLOR} /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.08, 0.1, 0.04, 12]} /><meshStandardMaterial color={METAL_COLOR} /></mesh>
    </group>
  )
}

function StandingTableMesh({ w, h, d }: { w: number; h: number; d: number }) {
  const r = Math.min(w, d) / 2
  return (
    <group>
      <mesh position={[0, h - 0.03, 0]}><cylinderGeometry args={[r, r, 0.06, 24]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>
      <mesh position={[0, (h - 0.06) / 2, 0]}><cylinderGeometry args={[0.03, 0.04, h - 0.06, 10]} /><meshStandardMaterial color={METAL_COLOR} /></mesh>
    </group>
  )
}

function ShapeMesh({ shape, w, h, d }: { shape: FurnitureShape; w: number; h: number; d: number }) {
  switch (shape) {
    case 'round-table': return <RoundTableMesh w={w} h={h} d={d} />
    case 'rectangular-table': return <RectangularTableMesh w={w} h={h} d={d} />
    case 'chair': return <ChairMesh w={w} h={h} d={d} />
    case 'stage': return <StageMesh w={w} h={h} d={d} />
    case 'bar': return <BarMesh w={w} h={h} d={d} />
    case 'sofa': return <SofaMesh w={w} h={h} d={d} />
    case 'high-top': return <HighTopTableMesh w={w} h={h} d={d} />
    case 'podium': return <PodiumMesh w={w} h={h} d={d} />
    case 'plant': return <PlantMesh w={w} h={h} d={d} />
    case 'lounge': return <LoungeMesh w={w} h={h} d={d} />
    case 'bar-stool': return <BarStoolMesh w={w} h={h} d={d} />
    case 'standing-table': return <StandingTableMesh w={w} h={h} d={d} />
    default: return <RectangularTableMesh w={w} h={h} d={d} />
  }
}

function Furniture3D({ item, template, floorLevelY }: { item: FurnitureItem; template: FurnitureTemplate; floorLevelY: number }) {
  const scale = 2
  const w = template.dimensions.width * scale
  const h = template.dimensions.height * scale
  const d = template.dimensions.depth * scale
  const yPos = item.position[1] + floorLevelY + h / 2

  return (
    <group position={[item.position[0], yPos, item.position[2]]} rotation={[0, item.rotation, 0]} scale={item.scale}>
      <ShapeMesh shape={template.shape} w={w} h={h} d={d} />
    </group>
  )
}

function FloorGrid() {
  return (
    <gridHelper args={[20, 20, '#888888', '#444444']} position={[0, 0, 0]} />
  )
}

export interface Scene3DProps {
  furniture: FurnitureItem[]
  floorLevelY: number
  findTemplate: (itemId: string) => FurnitureTemplate | undefined
}

export function SceneContent({ furniture, floorLevelY, findTemplate }: Scene3DProps) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, 5, -5]} intensity={0.6} />
      <pointLight position={[0, 5, 0]} intensity={0.4} />
      <FloorGrid />
      {furniture.map((item) => {
        const template = findTemplate(item.id)
        if (!template) return null
        return <Furniture3D key={item.id} item={item} template={template} floorLevelY={floorLevelY} />
      })}
    </>
  )
}
