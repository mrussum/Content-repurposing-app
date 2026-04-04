'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Plus, Trash2, Globe, Lock, TrendingUp } from 'lucide-react'
import type { Template } from '@/types/database'

interface TemplatesResponse { templates: Template[] }

async function fetchTemplates(): Promise<TemplatesResponse> {
  const res = await fetch('/api/templates')
  if (!res.ok) throw new Error('Failed to fetch templates')
  return res.json()
}

export function TemplatesClient() {
  const { data, error } = useSWR<TemplatesResponse>('templates', fetchTemplates)
  const [creating, setCreating]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', system_prompt_addon: '', is_public: false,
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/templates', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ name: '', description: '', system_prompt_addon: '', is_public: false })
        setShowForm(false)
        mutate('templates')
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      mutate('templates')
    } finally {
      setDeletingId(null)
    }
  }

  const templates = data?.templates ?? []
  const community = templates.filter(t => t.user_id === null)
  const mine      = templates.filter(t => t.user_id !== null)

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold font-syne text-white">Templates</h1>
          <p className="text-sm text-white/40 mt-1">
            Apply a template to shape how your content is transformed.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#c8ff00] text-black text-sm font-medium hover:bg-[#d4ff33] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New template
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-[#c8ff00]/20 bg-[#c8ff00]/5 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">New template</h2>
          <div className="space-y-3">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Template name"
              required
              className="w-full h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c8ff00]/40"
            />
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description (optional)"
              className="w-full h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c8ff00]/40"
            />
            <textarea
              value={form.system_prompt_addon}
              onChange={e => setForm(f => ({ ...f, system_prompt_addon: e.target.value }))}
              placeholder="Prompt instructions — e.g. 'Lead every format with a provocative question.'"
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#c8ff00]/40"
            />
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                className="rounded accent-[#c8ff00]"
              />
              Share with community
            </label>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !form.name.trim()}
              className="px-4 py-2 text-sm bg-[#c8ff00] text-black font-medium rounded-lg hover:bg-[#d4ff33] disabled:opacity-40 transition-colors"
            >
              {creating ? 'Saving…' : 'Save template'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-red-400">Failed to load templates.</p>}

      {/* My templates */}
      {mine.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider">My templates</h2>
          <div className="grid gap-3">
            {mine.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                isOwner
                onDelete={() => handleDelete(t.id)}
                deleting={deletingId === t.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Community templates */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider">Community templates</h2>
        {community.length === 0 && !error && (
          <p className="text-sm text-white/30">No community templates yet.</p>
        )}
        <div className="grid gap-3">
          {community.map(t => (
            <TemplateCard key={t.id} template={t} isOwner={false} onDelete={() => {}} deleting={false} />
          ))}
        </div>
      </section>
    </div>
  )
}

interface CardProps {
  template: Template
  isOwner:  boolean
  onDelete: () => void
  deleting: boolean
}

function TemplateCard({ template, isOwner, onDelete, deleting }: CardProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">{template.name}</p>
          {template.is_public
            ? <Globe className="h-3 w-3 text-[#c8ff00]/60 shrink-0" />
            : <Lock  className="h-3 w-3 text-white/20 shrink-0" />
          }
        </div>
        {template.description && (
          <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{template.description}</p>
        )}
        {template.system_prompt_addon && (
          <p className="text-xs text-white/20 mt-1 font-mono line-clamp-1">{template.system_prompt_addon}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {template.use_count > 0 && (
          <span className="flex items-center gap-1 text-xs text-white/30">
            <TrendingUp className="h-3 w-3" />
            {template.use_count}
          </span>
        )}
        {isOwner && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 rounded text-white/20 hover:text-red-400 transition-colors disabled:opacity-40"
            title="Delete template"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
