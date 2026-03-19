import React from 'react'
import { Canvas } from '@react-three/fiber/native'
import { SceneContent, type Scene3DProps } from './Scene3DShared'

export default function Scene3DView(props: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 4, 8], fov: 60 }}
      gl={{ antialias: true }}
      style={{ flex: 1 }}
    >
      <SceneContent {...props} />
    </Canvas>
  )
}
