import { Suspense } from 'react'
import { TemplatesClient } from './client'

export const metadata = { title: 'Templates — Content Studio Pro' }

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/40">Loading templates…</div>}>
      <TemplatesClient />
    </Suspense>
  )
}
