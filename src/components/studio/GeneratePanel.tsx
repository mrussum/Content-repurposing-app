'use client'

import { useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useStudioStore } from '@/stores/studioStore'
import { useGenerate } from '@/hooks/useGenerate'
import { UsageMeter } from '@/components/billing/UsageMeter'
import { cn } from '@/lib/utils'
import type { Tone, Audience, TwitterLength } from '@/types/generation'

const MAX_CHARS = 10_000

const TONES: { value: Tone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual',       label: 'Casual'       },
  { value: 'witty',        label: 'Witty'         },
  { value: 'educational',  label: 'Educational'  },
]

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'general',    label: 'General'    },
  { value: 'founders',   label: 'Founders'   },
  { value: 'marketers',  label: 'Marketers'  },
  { value: 'developers', label: 'Developers' },
]

const TWITTER_LENGTHS: TwitterLength[] = [5, 7, 10]

interface GeneratePanelProps {
  plan: 'free' | 'pro' | 'agency'
}

export function GeneratePanel({ plan }: GeneratePanelProps) {
  const content       = useStudioStore((s) => s.content)
  const tone          = useStudioStore((s) => s.tone)
  const audience      = useStudioStore((s) => s.audience)
  const twitterLength = useStudioStore((s) => s.twitterLength)
  const setContent    = useStudioStore((s) => s.setContent)
  const setTone       = useStudioStore((s) => s.setTone)
  const setAudience   = useStudioStore((s) => s.setAudience)
  const setTwitterLength = useStudioStore((s) => s.setTwitterLength)

  const { generate, isGenerating } = useGenerate()

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length <= MAX_CHARS) setContent(e.target.value)
    },
    [setContent]
  )

  const charCount  = content.length
  const isNearMax  = charCount > MAX_CHARS * 0.9
  const canGenerate = content.trim().length > 0 && !isGenerating

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <p className="text-xs font-medium text-[#555] uppercase tracking-wider mb-2">Content</p>
        <div className="relative">
          <Textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Paste your article, transcript, notes, or any content here…"
            className="min-h-[240px] text-sm leading-relaxed"
            autoFocus
          />
          <span
            className={cn(
              'absolute bottom-2 right-3 text-[10px]',
              isNearMax ? 'text-[#fb923c]' : 'text-[#2e2e2e]'
            )}
          >
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[#555] uppercase tracking-wider mb-2">Tone</p>
        <div className="flex flex-wrap gap-2">
          {TONES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTone(value)}
              className={cn(
                'px-3 py-1.5 rounded-sm border text-xs font-medium transition-all duration-150',
                tone === value
                  ? 'bg-[#c8ff00] text-black border-[#c8ff00]'
                  : 'bg-[#101010] text-[#555] border-[#1e1e1e] hover:border-[#2a2a2a] hover:text-[#888]'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[#555] uppercase tracking-wider mb-2">Audience</p>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setAudience(value)}
              className={cn(
                'px-3 py-1.5 rounded-sm border text-xs font-medium transition-all duration-150',
                audience === value
                  ? 'bg-[#c8ff00] text-black border-[#c8ff00]'
                  : 'bg-[#101010] text-[#555] border-[#1e1e1e] hover:border-[#2a2a2a] hover:text-[#888]'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[#555] uppercase tracking-wider mb-2">
          Twitter thread length
        </p>
        <div className="flex gap-2">
          {TWITTER_LENGTHS.map((len) => (
            <button
              key={len}
              onClick={() => setTwitterLength(len)}
              className={cn(
                'px-3 py-1.5 rounded-sm border text-xs font-medium transition-all duration-150',
                twitterLength === len
                  ? 'bg-[#c8ff00] text-black border-[#c8ff00]'
                  : 'bg-[#101010] text-[#555] border-[#1e1e1e] hover:border-[#2a2a2a] hover:text-[#888]'
              )}
            >
              {len} tweets
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <Button
          onClick={generate}
          disabled={!canGenerate}
          size="lg"
          className="w-full font-syne text-base"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              Generating…
            </span>
          ) : (
            'Generate'
          )}
        </Button>

        {plan === 'free' && (
          <div className="flex justify-center">
            <UsageMeter />
          </div>
        )}
      </div>
    </div>
  )
}
