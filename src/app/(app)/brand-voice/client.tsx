'use client'

import { useState } from 'react'
import { BrandVoiceEditor } from '@/components/studio/BrandVoiceEditor'

export function BrandVoicePageClient({ maxSlots }: { maxSlots: number }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
      <p className="text-xs text-[#555] uppercase tracking-wider mb-4">
        {maxSlots === 1 ? '1 voice slot' : `${maxSlots} voice slots`}
      </p>
      <BrandVoiceEditor
        selectedId={selectedId}
        onSelect={setSelectedId}
        maxSlots={maxSlots}
      />
    </div>
  )
}
