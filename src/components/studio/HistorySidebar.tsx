'use client'

import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { useHistory } from '@/hooks/useHistory'
import { useStudioStore } from '@/stores/studioStore'
import { truncate, formatDate } from '@/lib/utils'
import { UpgradeModal } from '@/components/billing/UpgradeModal'
import { useState } from 'react'
import type { Plan } from '@/types/generation'

interface HistorySidebarProps {
  plan: Plan
}

export function HistorySidebar({ plan }: HistorySidebarProps) {
  const { history, isLoading } = useHistory()
  const restoreGeneration       = useStudioStore((s) => s.restoreGeneration)
  const router                  = useRouter()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const isPro = plan === 'pro' || plan === 'agency'

  if (!isPro) {
    return (
      <>
        <div className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-8 text-center">
          <Clock className="h-8 w-8 text-[#333] mx-auto mb-3" />
          <p className="text-sm text-[#555] mb-4">
            History is a Pro feature. Upgrade to save and restore your last 10 generations.
          </p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="text-sm text-[#c8ff00] hover:underline"
          >
            Upgrade to Pro →
          </button>
        </div>
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          trigger="feature"
          feature="History"
        />
      </>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-[10px] bg-[#0e0e0e] animate-pulse" />
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-8 text-center">
        <p className="text-sm text-[#555]">No generations yet. Start generating to build your history.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {history.map((gen) => (
        <div
          key={gen.id}
          className="group flex items-start justify-between gap-4 rounded-[10px] border border-[#1a1a1a] bg-[#0c0c0c] p-4 hover:border-[#2a2a2a] transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#e8e8e8] truncate">{truncate(gen.contentInput, 70)}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-[#444]">{formatDate(gen.createdAt)}</span>
              <span className="text-[10px] text-[#333]">·</span>
              <span className="text-[10px] text-[#444] capitalize">{gen.tone}</span>
            </div>
          </div>
          <button
            onClick={() => {
              restoreGeneration(gen)
              router.push('/generate')
            }}
            className="shrink-0 text-xs text-[#555] hover:text-[#c8ff00] transition-colors opacity-0 group-hover:opacity-100"
          >
            Restore →
          </button>
        </div>
      ))}
    </div>
  )
}
