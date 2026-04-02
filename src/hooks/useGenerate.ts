'use client'

import { useStudioStore } from '@/stores/studioStore'
import type { FormatKey } from '@/types/generation'

export function useGenerate() {
  const generate      = useStudioStore((s) => s.generate)
  const regenerate    = useStudioStore((s) => s.regenerate)
  const isGenerating  = useStudioStore((s) => s.isGenerating)
  const regenLoadingTab = useStudioStore((s) => s.regenLoadingTab)
  const error         = useStudioStore((s) => s.error)
  const clearError    = useStudioStore((s) => s.clearError)

  return {
    generate,
    regenerate: (format: FormatKey, instruction?: string) => regenerate(format, instruction),
    isGenerating,
    regenLoadingTab,
    error,
    clearError,
  }
}
