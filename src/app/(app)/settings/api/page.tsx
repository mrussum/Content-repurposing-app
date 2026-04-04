import { Suspense } from 'react'
import { ApiKeysClient } from './client'

export const metadata = { title: 'API Keys — Content Studio Pro' }

export default function ApiKeysPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/40">Loading…</div>}>
      <ApiKeysClient />
    </Suspense>
  )
}
