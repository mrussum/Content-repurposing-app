'use client'

import { useState, useEffect } from 'react'
import { Loader2, ExternalLink } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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

const PUBLISHABLE: FormatKey[] = ['twitter', 'linkedin', 'newsletter']

export function PublishModal({ open, onClose, format, content, generationId }: PublishModalProps) {
  const [profiles,     setProfiles]     = useState<BufferProfile[]>([])
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [scheduledAt,  setScheduledAt]  = useState('')
  const [editedContent,setEditedContent]= useState(content)
  const [loading,      setLoading]      = useState(false)
  const [fetching,     setFetching]     = useState(false)
  const [done,         setDone]         = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [noBuffer,     setNoBuffer]     = useState(false)

  useEffect(() => {
    if (!open) return
    setFetching(true)
    fetch('/api/buffer/profiles')
      .then((r) => r.json())
      .then((data: { profiles?: BufferProfile[]; error?: string }) => {
        if (data.error?.includes('not connected')) { setNoBuffer(true); return }
        setProfiles(data.profiles ?? [])
        if (data.profiles?.length) setSelectedId(data.profiles[0].id)
      })
      .catch(() => setNoBuffer(true))
      .finally(() => setFetching(false))
  }, [open])

  async function handlePublish() {
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish to Buffer</DialogTitle>
          <DialogDescription>
            {done ? 'Posted successfully.' : `Publishing your ${format} post.`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-[#4ade80]">✓ Sent to Buffer</p>
            <p className="text-xs text-[#555]">Manage your post in the Buffer dashboard.</p>
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          </div>
        ) : noBuffer ? (
          <div className="flex flex-col gap-3 py-4 text-center">
            <p className="text-sm text-[#888]">Buffer is not connected.</p>
            <Button variant="secondary" size="sm" asChild>
              <a href="/settings?tab=integrations">
                Connect Buffer <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        ) : fetching ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[#444]" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            {/* Editable content */}
            <div>
              <p className="text-xs text-[#555] mb-1">Content</p>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={6}
                className="w-full rounded-[8px] border border-[#181818] bg-[#0e0e0e] px-3 py-2 text-sm text-[#e8e8e8] focus:border-[#c8ff00] focus:outline-none resize-none"
              />
            </div>

            {/* Profile selector */}
            {profiles.length > 0 && (
              <div>
                <p className="text-xs text-[#555] mb-1">Account</p>
                <div className="flex flex-col gap-1">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-[8px] border text-xs transition-colors text-left ${
                        selectedId === p.id
                          ? 'border-[#c8ff00] bg-[#c8ff0011] text-[#e8e8e8]'
                          : 'border-[#1a1a1a] text-[#888] hover:border-[#2a2a2a]'
                      }`}
                    >
                      <span className="capitalize font-medium">{p.service}</span>
                      <span className="text-[#444]">@{p.username}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule picker */}
            <div>
              <p className="text-xs text-[#555] mb-1">Schedule (optional — leave blank to post now)</p>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="h-9 w-full rounded-[8px] border border-[#181818] bg-[#0e0e0e] px-3 text-sm text-[#e8e8e8] focus:border-[#c8ff00] focus:outline-none"
              />
            </div>

            {error && <p className="text-xs text-[#ff7070]">{error}</p>}

            <Button
              onClick={handlePublish}
              disabled={loading || !selectedId}
              className="w-full"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</> : scheduledAt ? 'Schedule' : 'Publish Now'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
