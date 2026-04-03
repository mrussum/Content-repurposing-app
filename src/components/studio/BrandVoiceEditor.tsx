'use client'

import { useState } from 'react'
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useBrandVoice } from '@/hooks/useBrandVoice'
import { cn } from '@/lib/utils'
import type { BrandVoice } from '@/types/generation'

interface BrandVoiceEditorProps {
  selectedId:   string | null
  onSelect:     (id: string | null) => void
  maxSlots:     number
}

export function BrandVoiceEditor({ selectedId, onSelect, maxSlots }: BrandVoiceEditorProps) {
  const { voices, isLoading, refresh } = useBrandVoice()
  const [expanded, setExpanded]         = useState(false)
  const [saving,   setSaving]           = useState(false)
  const [newName,  setNewName]          = useState('My Brand Voice')
  const [samples,  setSamples]          = useState(['', ''])
  const [error,    setError]            = useState<string | null>(null)

  async function handleCreate() {
    const validSamples = samples.filter((s) => s.trim().length >= 10)
    if (validSamples.length === 0) {
      setError('Add at least one sample with 10+ characters.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res  = await fetch('/api/brand-voice', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: newName, samples: validSamples }),
      })
      const data = await res.json() as { voice?: BrandVoice; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      await refresh()
      onSelect(data.voice!.id)
      setExpanded(false)
      setSamples(['', ''])
      setNewName('My Brand Voice')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch('/api/brand-voice', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    if (selectedId === id) onSelect(null)
    await refresh()
  }

  if (isLoading) return <div className="h-10 animate-pulse rounded bg-[#141414]" />

  const canCreate = voices.length < maxSlots

  return (
    <div className="flex flex-col gap-2">
      {/* Existing voices */}
      {voices.length > 0 && (
        <div className="flex flex-col gap-1">
          {voices.map((voice) => (
            <div
              key={voice.id}
              className={cn(
                'group flex items-center justify-between rounded-[8px] border px-3 py-2 text-xs transition-colors cursor-pointer',
                selectedId === voice.id
                  ? 'border-[#c8ff00] bg-[#c8ff0011] text-[#e8e8e8]'
                  : 'border-[#1e1e1e] bg-[#101010] text-[#888] hover:border-[#2a2a2a]'
              )}
              onClick={() => onSelect(selectedId === voice.id ? null : voice.id)}
            >
              <span className="font-medium">{voice.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[#444]">{voice.samples.length} sample{voice.samples.length > 1 ? 's' : ''}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(voice.id) }}
                  className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-[#ff7070] transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new voice */}
      {canCreate && (
        <div className="rounded-[8px] border border-[#1a1a1a] bg-[#0e0e0e] overflow-hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs text-[#555] hover:text-[#888] transition-colors"
          >
            <span className="flex items-center gap-1.5"><Plus className="h-3 w-3" /> Add brand voice</span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {expanded && (
            <div className="px-3 pb-3 flex flex-col gap-2 border-t border-[#1a1a1a] pt-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Voice name"
                className="h-8 w-full rounded-[6px] border border-[#181818] bg-[#060606] px-2 text-xs text-[#e8e8e8] focus:border-[#c8ff00] focus:outline-none"
              />

              <p className="text-[10px] text-[#444]">Paste 1-5 samples of your writing (tweets, posts, articles)</p>

              {samples.map((sample, i) => (
                <div key={i} className="relative">
                  <Textarea
                    value={sample}
                    onChange={(e) => {
                      const next = [...samples]
                      next[i] = e.target.value
                      setSamples(next)
                    }}
                    placeholder={`Sample ${i + 1}…`}
                    className="min-h-[80px] text-xs"
                  />
                  {samples.length > 1 && (
                    <button
                      onClick={() => setSamples(samples.filter((_, j) => j !== i))}
                      className="absolute top-2 right-2 text-[#333] hover:text-[#ff7070] transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}

              {samples.length < 5 && (
                <button
                  onClick={() => setSamples([...samples, ''])}
                  className="text-xs text-[#555] hover:text-[#888] text-left transition-colors"
                >
                  + Add another sample
                </button>
              )}

              {error && <p className="text-xs text-[#ff7070]">{error}</p>}

              <Button onClick={handleCreate} disabled={saving} size="sm" className="w-full">
                {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Analyzing…</> : 'Save & Analyze Voice'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
