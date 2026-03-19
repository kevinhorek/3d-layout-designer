import React from 'react'
import { Canvas } from '@react-three/fiber'
import { SceneContent, type Scene3DProps } from './Scene3DShared'

export default function Scene3DView(props: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 4, 8], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ flex: 1, width: '100%', height: '100%', minHeight: 320, background: '#222' }}
    >
      <SceneContent {...props} />
    </Canvas>
  )
}
