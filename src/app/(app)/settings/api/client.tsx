'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Copy, Check, Trash2, Plus, Key } from 'lucide-react'
import type { ApiKey } from '@/types/database'

interface KeysResponse { keys: Omit<ApiKey, 'key_hash'>[] }

async function fetchKeys(): Promise<KeysResponse> {
  const res = await fetch('/api/v1/keys')
  if (res.status === 403) return { keys: [] }   // not agency — handled in UI
  if (!res.ok) throw new Error('Failed to fetch keys')
  return res.json()
}

export function ApiKeysClient() {
  const { data, error } = useSWR<KeysResponse>('api-keys', fetchKeys)
  const [newKeyName, setNewKeyName]     = useState('')
  const [creating, setCreating]         = useState(false)
  const [revealedKey, setRevealedKey]   = useState<string | null>(null)
  const [copied, setCopied]             = useState(false)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [isAgency, setIsAgency]         = useState(true)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/v1/keys', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: newKeyName.trim() }),
      })
      if (res.status === 403) { setIsAgency(false); return }
      const data = await res.json()
      if (data.key?.raw_key) {
        setRevealedKey(data.key.raw_key)
        setNewKeyName('')
        mutate('api-keys')
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/v1/keys/${id}`, { method: 'DELETE' })
      mutate('api-keys')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleCopy() {
    if (!revealedKey) return
    await navigator.clipboard.writeText(revealedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isAgency) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="rounded-xl border border-[#c8ff00]/20 bg-[#c8ff00]/5 p-6 text-center">
          <Key className="h-8 w-8 text-[#c8ff00] mx-auto mb-3" />
          <p className="text-white font-semibold mb-2">Agency Plan Required</p>
          <p className="text-white/50 text-sm">API access is available on the Agency plan ($49/month).</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold font-syne text-white">API Keys</h1>
        <p className="text-sm text-white/40 mt-1">
          Use these keys to call the Content Studio API from your own apps.
          Keys start with <code className="text-[#c8ff00] text-xs">csp_</code>.
        </p>
      </div>

      {/* Revealed key banner */}
      {revealedKey && (
        <div className="rounded-xl border border-[#c8ff00]/30 bg-[#c8ff00]/5 p-4">
          <p className="text-xs text-[#c8ff00] font-medium mb-2">New API key — copy it now, it won&apos;t be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-white/80 bg-black/40 rounded px-3 py-2 break-all font-mono">
              {revealedKey}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 p-2 rounded text-white/50 hover:text-white transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            className="mt-3 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          value={newKeyName}
          onChange={e => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g. Production, Zapier)"
          className="flex-1 h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c8ff00]/40"
        />
        <button
          type="submit"
          disabled={creating || !newKeyName.trim()}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#c8ff00] text-black text-sm font-medium hover:bg-[#d4ff33] disabled:opacity-40 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {creating ? 'Creating…' : 'Create key'}
        </button>
      </form>

      {/* Keys list */}
      <div className="space-y-2">
        {error && <p className="text-sm text-red-400">Failed to load API keys.</p>}
        {!data && !error && (
          <div className="animate-pulse space-y-2">
            {[1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-white/5" />)}
          </div>
        )}
        {data?.keys.length === 0 && (
          <p className="text-sm text-white/30 py-4 text-center">No API keys yet.</p>
        )}
        {data?.keys.map(key => (
          <div key={key.id} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <Key className="h-4 w-4 text-white/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{key.name}</p>
              <p className="text-xs text-white/30 font-mono">{key.key_prefix}•••••••••••••••••</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-white/30">
                {key.last_used_at
                  ? `Used ${new Date(key.last_used_at).toLocaleDateString()}`
                  : 'Never used'}
              </p>
              <p className="text-xs text-white/20">
                Created {new Date(key.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleDelete(key.id)}
              disabled={deletingId === key.id}
              className="p-2 rounded text-white/30 hover:text-red-400 transition-colors disabled:opacity-40"
              title="Revoke key"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Usage docs */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Usage</p>
        <pre className="text-xs text-white/60 font-mono leading-relaxed overflow-auto">{`POST ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-app.com'}/api/v1/generate
Authorization: Bearer csp_your_key_here
Content-Type: application/json

{
  "content": "Your article text here...",
  "tone": "professional",
  "audience": "founders"
}`}</pre>
      </div>
    </div>
  )
}
