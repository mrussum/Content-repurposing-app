import { create } from 'zustand'
import type {
  Tone,
  Audience,
  FormatKey,
  Generation,
  TwitterLength,
} from '@/types/generation'

interface StudioStore {
  // Input
  content:        string
  tone:           Tone
  audience:       Audience
  brandVoiceId:   string | null
  twitterLength:  TwitterLength

  // Output
  currentGeneration:  Generation | null
  activeTab:          FormatKey
  regenLoadingTab:    FormatKey | null

  // UI
  isGenerating: boolean
  error:        string | null

  // Actions
  setContent:      (content: string) => void
  setTone:         (tone: Tone) => void
  setAudience:     (audience: Audience) => void
  setBrandVoiceId: (id: string | null) => void
  setTwitterLength:(length: TwitterLength) => void
  setActiveTab:    (tab: FormatKey) => void
  clearError:      () => void
  generate:        () => Promise<void>
  regenerate:      (format: FormatKey, instruction?: string) => Promise<void>
  restoreGeneration: (generation: Generation) => void
}

export const useStudioStore = create<StudioStore>((set, get) => ({
  content:           '',
  tone:              'professional',
  audience:          'general',
  brandVoiceId:      null,
  twitterLength:     7,
  currentGeneration: null,
  activeTab:         'summary',
  regenLoadingTab:   null,
  isGenerating:      false,
  error:             null,

  setContent:       (content)       => set({ content }),
  setTone:          (tone)          => set({ tone }),
  setAudience:      (audience)      => set({ audience }),
  setBrandVoiceId:  (brandVoiceId)  => set({ brandVoiceId }),
  setTwitterLength: (twitterLength) => set({ twitterLength }),
  setActiveTab:     (activeTab)     => set({ activeTab }),
  clearError:       ()              => set({ error: null }),

  restoreGeneration: (generation) => {
    set({
      currentGeneration: generation,
      content:           generation.contentInput,
      tone:              generation.tone,
      audience:          generation.audience,
      brandVoiceId:      generation.brandVoiceId,
      activeTab:         'summary',
    })
  },

  generate: async () => {
    const { content, tone, audience, brandVoiceId, twitterLength } = get()
    if (!content.trim()) return

    set({ isGenerating: true, error: null, currentGeneration: null })

    try {
      const res = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content, tone, audience, brandVoiceId, twitterLength }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string; upgrade?: boolean }
        set({
          error:        data.error ?? 'Generation failed',
          isGenerating: false,
        })
        return
      }

      const data = await res.json() as { id: string; result: Generation['result']; usage: unknown }
      const generation: Generation = {
        id:           data.id,
        userId:       '',
        contentInput: content,
        result:       data.result,
        tone,
        audience,
        brandVoiceId,
        wordCount:    content.trim().split(/\s+/).length,
        createdAt:    new Date().toISOString(),
      }

      set({ currentGeneration: generation, isGenerating: false, activeTab: 'summary' })
    } catch (err) {
      set({
        error:        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        isGenerating: false,
      })
    }
  },

  regenerate: async (format, instruction) => {
    const { currentGeneration } = get()
    if (!currentGeneration) return

    set({ regenLoadingTab: format, error: null })

    try {
      const res = await fetch('/api/regenerate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          generationId: currentGeneration.id,
          format,
          instruction,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        set({ error: data.error ?? 'Regeneration failed', regenLoadingTab: null })
        return
      }

      const data = await res.json() as { result: unknown }
      set({
        currentGeneration: {
          ...currentGeneration,
          result: { ...currentGeneration.result, [format]: data.result },
        },
        regenLoadingTab: null,
      })
    } catch (err) {
      set({
        error:          err instanceof Error ? err.message : 'Something went wrong.',
        regenLoadingTab: null,
      })
    }
  },
}))
