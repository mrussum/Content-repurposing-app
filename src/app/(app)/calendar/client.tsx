'use client'

import { useState, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { CalendarWeek } from '@/components/calendar/CalendarWeek'
import type { PublishedPost } from '@/types/database'

function getWeekStart(d: Date): Date {
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  start.setHours(0, 0, 0, 0)
  return start
}

async function fetchScheduledPosts(): Promise<PublishedPost[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('published_posts')
    .select('*')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })
  return (data ?? []) as PublishedPost[]
}

export function CalendarClient() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [editingPost, setEditingPost] = useState<PublishedPost | null>(null)

  const { data: posts = [] } = useSWR<PublishedPost[]>('scheduled-posts', fetchScheduledPosts, {
    refreshInterval: 30_000,
  })

  const handleReschedule = useCallback(async (postId: string, newTime: Date) => {
    const supabase = createClient()
    await supabase
      .from('published_posts')
      .update({ scheduled_at: newTime.toISOString() })
      .eq('id', postId)
    mutate('scheduled-posts')
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editingPost) return
    const supabase = createClient()
    await supabase
      .from('published_posts')
      .update({ content: editingPost.content })
      .eq('id', editingPost.id)
    setEditingPost(null)
    mutate('scheduled-posts')
  }, [editingPost])

  function prevWeek() {
    setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() - 7); return d })
  }
  function nextWeek() {
    setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() + 7); return d })
  }

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-semibold font-syne text-white">Content Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="px-3 py-1.5 rounded text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm font-medium text-white min-w-[160px] text-center">
            {fmt(weekStart)} – {fmt(weekEnd)}
          </span>
          <button
            onClick={nextWeek}
            className="px-3 py-1.5 rounded text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Next →
          </button>
          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="px-3 py-1.5 rounded text-sm text-[#c8ff00] hover:bg-[#c8ff00]/10 transition-colors border border-[#c8ff00]/30"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <CalendarWeek
          posts={posts}
          weekStart={weekStart}
          onEdit={setEditingPost}
          onReschedule={handleReschedule}
        />
      </div>

      {posts.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/30 text-sm">No scheduled posts this week</p>
        </div>
      )}

      {/* Edit modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold capitalize">{editingPost.platform} post</h2>
              <button onClick={() => setEditingPost(null)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="text-xs text-white/40">
              Scheduled: {editingPost.scheduled_at ? new Date(editingPost.scheduled_at).toLocaleString() : '—'}
            </div>
            <textarea
              value={editingPost.content}
              onChange={e => setEditingPost(p => p ? { ...p, content: e.target.value } : p)}
              className="w-full h-40 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-[#c8ff00]/40"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm bg-[#c8ff00] text-black font-medium rounded-lg hover:bg-[#d4ff33] transition-colors"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
