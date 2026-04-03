import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { PosthogProvider } from '@/components/providers/PosthogProvider'
import { SWRegistrar } from '@/components/providers/SWRegistrar'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title:       'Content Studio Pro',
  description: 'Repurpose content to 7 platforms in 30 seconds',
  manifest:    '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor:   '#c8ff00',
  width:        'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#060606] text-[#e8e8e8] antialiased">
        <SWRegistrar />
        <Suspense>
          <PosthogProvider>
            {children}
          </PosthogProvider>
        </Suspense>
      </body>
    </html>
  )
}
