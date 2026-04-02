'use client'

import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FormatKey } from '@/types/generation'

const FORMAT_LABELS: Record<FormatKey, string> = {
  summary:    'Summary',
  twitter:    'Twitter',
  linkedin:   'LinkedIn',
  instagram:  'Instagram',
  blog:       'Blog Outline',
  newsletter: 'Newsletter',
  quotes:     'Quotes',
}

interface FormatTabProps {
  format:      FormatKey
  isActive:    boolean
  isReady:     boolean
  isGenerating:boolean
  isLocked:    boolean
  onClick:     () => void
}

export function FormatTab({
  format,
  isActive,
  isReady,
  isGenerating,
  isLocked,
  onClick,
}: FormatTabProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked || (!isReady && !isGenerating)}
      className={cn(
        'relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2',
        isActive
          ? 'border-[#c8ff00] text-[#e8e8e8]'
          : 'border-transparent text-[#555] hover:text-[#888]',
        isLocked && 'opacity-40 cursor-not-allowed'
      )}
    >
      {FORMAT_LABELS[format]}

      {isLocked ? (
        <Lock className="h-3 w-3 text-[#444]" />
      ) : isReady ? (
        <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
      ) : isGenerating ? (
        <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff00] animate-pulse-dot" />
      ) : null}
    </button>
  )
}
