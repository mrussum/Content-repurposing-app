'use client'

import { useState, useEffect } from 'react'
import { Loader2, ExternalLink } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FormatKey } from '@/types/generation'

interface BufferProfile {
  id:       string
  service:  string
  username: string
}

interface PublishModalProps {
  open:         boolean
  onClose:      () => void
  format:       FormatKey
  content:      string
  generationId: string
}

type PublishTab = 'direct' | 'buffer'

const PUBLISHABLE: FormatKey[] = ['twitter', 'linkedin', 'newsletter']

export function PublishModal({ open, onClose, format, content, generationId }: PublishModalProps) {
  const [tab,           setTab]           = useState<PublishTab>('direct')
  const [editedContent, setEditedContent] = useState(content)
  const [scheduledAt,   setScheduledAt]   = useState('')
  const [loading,       setLoading]       = useState(false)
  const [done,          setDone]          = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // Buffer state
  const [profiles,   setProfiles]   = useState<BufferProfile[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fetching,   setFetching]   = useState(false)
  const [noBuffer,   setNoBuffer]   = useState(false)

  // Direct state
  const [directConnected, setDirectConnected] = useState<boolean | null>(null)

  useEffect(() => {
    if (!open) { setDone(false); setError(null); return }
    setEditedContent(content)

    // Probe direct connection status for this format
    if (format === 'twitter' || format === 'linkedin') {
      setDirectConnected(null)
      fetch(`/api/publish/${format}/status`)
        .then(r => r.json())
        .then((d: { connected: boolean }) => setDirectConnected(d.connected))
        .catch(() => setDirectConnected(false))
    }

    // Fetch Buffer profiles
    setFetching(true)
    fetch('/api/buffer/profiles')
      .then(r => r.json())
      .then((data: { profiles?: BufferProfile[]; error?: string }) => {
        if (data.error?.includes('not connected')) { setNoBuffer(true); return }
        setProfiles(data.profiles ?? [])
        if (data.profiles?.length) setSelectedId(data.profiles[0].id)
      })
      .catch(() => setNoBuffer(true))
      .finally(() => setFetching(false))
  }, [open, content, format])

  async function handleDirectPublish() {
    setLoading(true)
    setError(null)
    try {
      const endpoint = `/api/publish/${format}`
      const body: Record<string, unknown> = { generationId }

      if (format === 'twitter') {
        body.tweets = editedContent.split('\n\n').filter(Boolean)
        if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString()
      } else {
        body.content = editedContent
      }

      const res  = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json() as { error?: string; connect?: boolean }
      if (!res.ok) {
        if (data.connect) setDirectConnected(false)
        setError(data.error ?? 'Failed to publish')
        return
      }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleBufferPublish() {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        generationId,
        format,
        content: format === 'twitter'
          ? JSON.stringify(editedContent.split('\n\n').filter(Boolean))
          : editedContent,
        profileId: selectedId,
      }
      if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString()

      const res  = await fetch('/api/publish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to publish'); return }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (!PUBLISHABLE.includes(format)) return null

  const canDirect = format === 'twitter' || format === 'linkedin'
  const platformLabel = format.charAt(0).toUpperCase() + format.slice(1)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish {platformLabel}</DialogTitle>
          <DialogDescription>
            {done ? 'Published successfully.' : `Choose how to publish your ${format} post.`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-[#4ade80]">✓ Published</p>
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            {canDirect && (
              <div className="flex gap-1 rounded-lg bg-white/5 p-1 mt-2">
                {(['direct', 'buffer'] as PublishTab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                      tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                    )}
                  >
                    {t === 'direct' ? `Direct (${platformLabel})` : 'Via Buffer'}
                  </button>
                ))}
              </div>
            )}

            {/* Shared content editor */}
            <div className="mt-3">
              <p className="text-xs text-[#555] mb-1">Content</p>
              <textarea
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
                rows={6}
                className="w-full rounded-[8px] border border-[#181818] bg-[#0e0e0e] px-3 py-2 text-sm text-[#e8e8e8] focus:border-[#c8ff00] focus:outline-none resize-none"
              />
            </div>

            {/* Direct tab */}
            {(tab === 'direct' || !canDirect) && (
              <DirectTabContent
                format={format}
                connected={directConnected}
                scheduledAt={scheduledAt}
                setScheduledAt={setScheduledAt}
                loading={loading}
                error={error}
                onPublish={handleDirectPublish}
              />
            )}

            {/* Buffer tab */}
            {tab === 'buffer' && canDirect && (
              <BufferTabContent
                fetching={fetching}
                noBuffer={noBuffer}
                profiles={profiles}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                scheduledAt={scheduledAt}
                setScheduledAt={setScheduledAt}
                loading={loading}
                error={error}
                onPublish={handleBufferPublish}
              />
            )}

            {/* Buffer-only formats (newsletter) */}
            {!canDirect && (
              <BufferTabContent
                fetching={fetching}
                noBuffer={noBuffer}
                profiles={profiles}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                scheduledAt={scheduledAt}
                setScheduledAt={setScheduledAt}
                loading={loading}
                error={error}
                onPublish={handleBufferPublish}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface DirectTabProps {
  format:         FormatKey
  connected:      boolean | null
  scheduledAt:    string
  setScheduledAt: (v: string) => void
  loading:        boolean
  error:          string | null
  onPublish:      () => void
}

function DirectTabContent({ format, connected, scheduledAt, setScheduledAt, loading, error, onPublish }: DirectTabProps) {
  if (connected === null) {
    return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-[#444]" /></div>
  }

  if (!connected) {
    return (
      <div className="flex flex-col gap-3 py-4 text-center">
        <p className="text-sm text-[#888]">{format === 'twitter' ? 'Twitter' : 'LinkedIn'} is not connected.</p>
        <Button variant="secondary" size="sm" asChild>
          <a href={`/api/publish/${format}/oauth`}>
            Connect {format === 'twitter' ? 'Twitter / X' : 'LinkedIn'} <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 mt-2">
      {format === 'twitter' && (
        <div>
          <p className="text-xs text-[#555] mb-1">Schedule (optional)</p>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="h-9 w-full rounded-[8px] border border-[#181818] bg-[#0e0e0e] px-3 text-sm text-[#e8e8e8] focus:border-[#c8ff00] focus:outline-none"
          />
        </div>
      )}
      {error && <p className="text-xs text-[#ff7070]">{error}</p>}
      <Button onClick={onPublish} disabled={loading} className="w-full">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</> : scheduledAt ? 'Schedule' : 'Publish Now'}
      </Button>
    </div>
  )
}

interface BufferTabProps {
  fetching:       boolean
  noBuffer:       boolean
  profiles:       BufferProfile[]
  selectedId:     string | null
  setSelectedId:  (id: string) => void
  scheduledAt:    string
  setScheduledAt: (v: string) => void
  loading:        boolean
  error:          string | null
  onPublish:      () => void
}

function BufferTabContent({ fetching, noBuffer, profiles, selectedId, setSelectedId, scheduledAt, setScheduledAt, loading, error, onPublish }: BufferTabProps) {
  if (fetching) {
    return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-[#444]" /></div>
  }
  if (noBuffer || profiles.length === 0) {
    return (
      <div className="flex flex-col gap-3 py-4 text-center">
        <p className="text-sm text-[#888]">Buffer is not connected.</p>
        <Button variant="secondary" size="sm" asChild>
          <a href="/settings?tab=integrations">Connect Buffer <ExternalLink className="ml-1 h-3 w-3" /></a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 mt-2">
      <div>
        <p className="text-xs text-[#555] mb-1">Account</p>
        <div className="flex flex-col gap-1">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-[8px] border text-xs transition-colors text-left',
                selectedId === p.id
                  ? 'border-[#c8ff00] bg-[#c8ff0011] text-[#e8e8e8]'
                  : 'border-[#1a1a1a] text-[#888] hover:border-[#2a2a2a]'
              )}
            >
              <span className="capitalize font-medium">{p.service}</span>
              <span className="text-[#444]">@{p.username}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-[#555] mb-1">Schedule (optional)</p>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          className="h-9 w-full rounded-[8px] border border-[#181818] bg-[#0e0e0e] px-3 text-sm text-[#e8e8e8] focus:border-[#c8ff00] focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-[#ff7070]">{error}</p>}
      <Button onClick={onPublish} disabled={loading || !selectedId} className="w-full">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</> : scheduledAt ? 'Schedule' : 'Publish Now'}
      </Button>
    </div>
  )
}
