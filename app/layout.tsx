import type { Metadata, Viewport } from 'next'
import './layout-designer.css'
import { RegisterSw } from './RegisterSw'

export const metadata: Metadata = {
  title: '3D Layout Designer',
  description: 'Design and visualize event layouts in 3D',
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1a1a1a'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}>
        <RegisterSw />
        {children}
      </body>
    </html>
  )
}
