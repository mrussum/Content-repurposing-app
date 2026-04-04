'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { useStudioStore } from '@/stores/studioStore'
import { useGenerate } from '@/hooks/useGenerate'
import { FormatTab } from './FormatTab'
import { InstagramCarousel } from './InstagramCarousel'
import { PublishModal } from './PublishModal'
import { cn } from '@/lib/utils'
import type { FormatKey } from '@/types/generation'

const FORMAT_ORDER: FormatKey[] = [
  'summary', 'twitter', 'linkedin', 'quotes', 'instagram', 'blog', 'newsletter',
]

const FREE_FORMATS: FormatKey[] = [
  'summary', 'twitter', 'linkedin', 'blog', 'newsletter', 'quotes',
]

interface OutputPanelProps {
  plan: 'free' | 'pro' | 'agency'
}

export function OutputPanel({ plan }: OutputPanelProps) {
  const currentGeneration = useStudioStore((s) => s.currentGeneration)
  const activeTab         = useStudioStore((s) => s.activeTab)
  const isGenerating      = useStudioStore((s) => s.isGenerating)
  const setActiveTab      = useStudioStore((s) => s.setActiveTab)
  const { regenerate, regenLoadingTab } = useGenerate()

  const isPro = plan === 'pro' || plan === 'agency'
  const [copiedFormat, setCopiedFormat]   = useState<FormatKey | null>(null)
  const [regenInstruction, setRegenInstruction] = useState('')
  const [showRegenInput, setShowRegenInput]     = useState(false)
  const [publishOpen, setPublishOpen]           = useState(false)
  const PUBLISHABLE: FormatKey[] = ['twitter', 'linkedin', 'newsletter']

  const handleCopy = useCallback(async (text: string, format: FormatKey) => {
    await navigator.clipboard.writeText(text)
    setCopiedFormat(format)
    setTimeout(() => setCopiedFormat(null), 1800)
  }, [])

  const handleRegen = useCallback(() => {
    regenerate(activeTab, regenInstruction || undefined)
    setRegenInstruction('')
    setShowRegenInput(false)
  }, [activeTab, regenInstruction, regenerate])

  const getFormatText = (format: FormatKey): string => {
    if (!currentGeneration) return ''
    const result = currentGeneration.result
    switch (format) {
      case 'summary':    return result.summary
      case 'twitter':    return result.twitter.tweets.join('\n\n')
      case 'linkedin':   return result.linkedin
      case 'newsletter': return result.newsletter
      case 'quotes':     return result.quotes.join('\n\n')
      case 'instagram':  return result.instagram
        .map((s) => `Slide ${s.slide} — ${s.headline}\n${s.body}`)
        .join('\n\n')
      case 'blog':       return result.blogOutline
        .map((s) => `## ${s.heading}\n${s.points.map((p) => `- ${p}`).join('\n')}`)
        .join('\n\n')
      default:           return ''
    }
  }

  if (!isGenerating && !currentGeneration) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-8">
        <div className="text-[#1a1a1a] text-6xl mb-6 select-none">✦</div>
        <p className="text-[#444] text-sm max-w-xs leading-relaxed">
          Paste your content and hit Generate. Your 7 formats will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[#111111] overflow-x-auto scrollbar-none px-1">
        {FORMAT_ORDER.map((format) => {
          const isLocked = !isPro && !FREE_FORMATS.includes(format)
          const isReady  = !!currentGeneration?.result
          return (
            <FormatTab
              key={format}
              format={format}
              isActive={activeTab === format}
              isReady={isReady}
              isGenerating={isGenerating}
              isLocked={isLocked}
              onClick={() => !isLocked && setActiveTab(format)}
            />
          )
        })}
      </div>

      {/* Action bar */}
      {currentGeneration && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#0e0e0e]">
          <span className="text-[10px] text-[#444] uppercase tracking-wider mr-auto">
            {activeTab}
          </span>

          {isPro && (
            <div className="flex items-center gap-2">
                  <RegenControl
                instruction={regenInstruction}
                setInstruction={setRegenInstruction}
                show={showRegenInput}
                setShow={setShowRegenInput}
                loading={regenLoadingTab === activeTab}
                onRegen={handleRegen}
              />
            </div>
          )}

          {isPro && PUBLISHABLE.includes(activeTab) && (
            <button
              onClick={() => setPublishOpen(true)}
              className="flex items-center gap-1.5 h-7 px-2 rounded border border-[#1a1a1a] text-[#555] hover:text-[#888] hover:border-[#2a2a2a] text-xs transition-colors"
            >
              Publish
            </button>
          )}

          <button
            onClick={() => handleCopy(getFormatText(activeTab), activeTab)}
            className="flex items-center gap-1.5 h-7 px-2 rounded border border-[#1a1a1a] text-[#555] hover:text-[#888] hover:border-[#2a2a2a] text-xs transition-colors"
          >
            {copiedFormat === activeTab ? (
              <><Check className="h-3 w-3 text-[#4ade80]" /> Copied</>
            ) : (
              <><Copy className="h-3 w-3" /> Copy</>
            )}
          </button>
        </div>
      )}

      {/* Content */}
      {currentGeneration && publishOpen && PUBLISHABLE.includes(activeTab) && (
        <PublishModal
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          format={activeTab}
          content={getFormatText(activeTab)}
          generationId={currentGeneration.id}
        />
      )}

      <div className="flex-1 overflow-y-auto p-5">
        {isGenerating && !currentGeneration ? (
          <GeneratingSkeleton />
        ) : currentGeneration ? (
          <FormatContent
            format={activeTab}
            result={currentGeneration.result}
            onCopy={handleCopy}
            copiedFormat={copiedFormat}
          />
        ) : null}
      </div>
    </div>
  )
}

function GeneratingSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-[#141414]"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  )
}

interface FormatContentProps {
  format:       FormatKey
  result:       NonNullable<ReturnType<typeof useStudioStore.getState>['currentGeneration']>['result']
  onCopy:       (text: string, format: FormatKey) => void
  copiedFormat: FormatKey | null
}

function FormatContent({ format, result, onCopy, copiedFormat }: FormatContentProps) {
  switch (format) {
    case 'summary':
      return <p className="text-[#e8e8e8] text-sm leading-relaxed">{result.summary}</p>

    case 'twitter':
      return (
        <div className="flex flex-col gap-3">
          {result.twitter.tweets.map((tweet, i) => (
            <div key={i} className="group relative rounded-[10px] border border-[#1a1a1a] bg-[#0e0e0e] p-4">
              <p className="text-sm text-[#e8e8e8] leading-relaxed whitespace-pre-wrap">{tweet}</p>
              <span className="mt-2 block text-[10px] text-[#444]">{tweet.length} chars</span>
              <button
                onClick={() => onCopy(tweet, format)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded text-[#555] hover:text-[#888] transition-all"
              >
                {copiedFormat === format ? <Check className="h-3 w-3 text-[#4ade80]" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          ))}
        </div>
      )

    case 'linkedin':
    case 'newsletter':
      return (
        <p className="text-sm text-[#e8e8e8] leading-relaxed whitespace-pre-wrap">
          {format === 'linkedin' ? result.linkedin : result.newsletter}
        </p>
      )

    case 'quotes':
      return (
        <div className="flex flex-col gap-3">
          {result.quotes.map((quote, i) => (
            <div key={i} className="group relative rounded-[10px] border border-[#1a1a1a] bg-[#0e0e0e] p-4">
              <p className="text-sm text-[#e8e8e8] leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
              <button
                onClick={() => onCopy(quote, format)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded text-[#555] hover:text-[#888] transition-all"
              >
                {copiedFormat === format ? <Check className="h-3 w-3 text-[#4ade80]" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          ))}
        </div>
      )

    case 'instagram':
      return <InstagramCarousel slides={result.instagram} />

    case 'blog':
      return (
        <div className="flex flex-col gap-6">
          {result.blogOutline.map((section, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold text-[#e8e8e8] mb-2 font-syne">
                {section.heading}
              </h3>
              <ul className="flex flex-col gap-1">
                {section.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-[#888]">
                    <span className="mt-2 h-1 w-1 rounded-full bg-[#c8ff00] shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )

    default:
      return null
  }
}

const REGEN_CHIPS = [
  'Make it shorter',
  'Make it funnier',
  'More formal',
  'Add a statistic',
  'More punchy',
  'Simplify language',
] as const

interface RegenControlProps {
  instruction:    string
  setInstruction: (v: string) => void
  show:           boolean
  setShow:        (v: boolean) => void
  loading:        boolean
  onRegen:        () => void
}

function RegenControl({ instruction, setInstruction, show, setShow, loading, onRegen }: RegenControlProps) {
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        disabled={loading}
        className="flex items-center gap-1.5 h-7 px-2 rounded border border-[#1a1a1a] text-[#555] hover:text-[#888] hover:border-[#2a2a2a] text-xs transition-colors disabled:opacity-40"
      >
        <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
        Regenerate
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {/* Instruction chips */}
      <div className="flex flex-wrap gap-1 justify-end">
        {REGEN_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setInstruction(chip)}
            className={cn(
              'h-6 px-2 rounded-full text-[10px] border transition-colors',
              instruction === chip
                ? 'border-[#c8ff00]/50 bg-[#c8ff00]/10 text-[#c8ff00]'
                : 'border-[#1a1a1a] text-[#444] hover:text-[#888] hover:border-[#2a2a2a]'
            )}
          >
            {chip}
          </button>
        ))}
      </div>
      {/* Input + actions */}
      <div className="flex items-center gap-1.5">
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onRegen()}
          placeholder="Custom instruction…"
          className="h-7 w-40 rounded border border-[#2a2a2a] bg-[#0e0e0e] px-2 text-xs text-[#e8e8e8] focus:border-[#c8ff00] focus:outline-none"
          autoFocus
        />
        <button
          onClick={onRegen}
          disabled={loading}
          className="h-7 px-2 rounded text-xs border border-[#2a2a2a] text-[#888] hover:text-[#e8e8e8] transition-colors disabled:opacity-40"
        >
          Go
        </button>
        <button
          onClick={() => { setShow(false); setInstruction('') }}
          className="h-7 px-2 text-xs text-[#444] hover:text-[#888] transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
