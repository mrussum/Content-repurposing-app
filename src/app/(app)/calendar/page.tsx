import { Suspense } from 'react'
import { CalendarClient } from './client'

export const metadata = { title: 'Content Calendar — Content Studio Pro' }

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/40">Loading calendar…</div>}>
      <CalendarClient />
    </Suspense>
  )
}
