'use client'

import { useState } from 'react'
import type { PublishedPost } from '@/types/database'

const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]

const PLATFORM_COLORS: Record<string, string> = {
  twitter:   'bg-sky-500/20 border-sky-500/50 text-sky-300',
  linkedin:  'bg-blue-500/20 border-blue-500/50 text-blue-300',
  instagram: 'bg-pink-500/20 border-pink-500/50 text-pink-300',
  newsletter:'bg-purple-500/20 border-purple-500/50 text-purple-300',
}

interface Props {
  posts:      PublishedPost[]
  weekStart:  Date
  onEdit:     (post: PublishedPost) => void
  onReschedule:(postId: string, newTime: Date) => void
}

export function CalendarWeek({ posts, weekStart, onEdit, onReschedule }: Props) {
  const [dragOver, setDragOver] = useState<string | null>(null)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  function getPostsForSlot(day: Date, hour: number): PublishedPost[] {
    return posts.filter(p => {
      if (!p.scheduled_at) return false
      const t = new Date(p.scheduled_at)
      return (
        t.getFullYear() === day.getFullYear() &&
        t.getMonth()    === day.getMonth()    &&
        t.getDate()     === day.getDate()     &&
        t.getHours()    === hour
      )
    })
  }

  function slotKey(dayIdx: number, hour: number) {
    return `${dayIdx}-${hour}`
  }

  function handleDrop(e: React.DragEvent, day: Date, hour: number) {
    e.preventDefault()
    const postId = e.dataTransfer.getData('postId')
    if (!postId) return
    const newTime = new Date(day)
    newTime.setHours(hour, 0, 0, 0)
    onReschedule(postId, newTime)
    setDragOver(null)
  }

  return (
    <div className="overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-white/10 sticky top-0 bg-[#0a0a0a] z-10">
        <div />
        {days.map((day, i) => {
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div key={i} className={`text-center py-2 text-sm font-medium ${isToday ? 'text-[#c8ff00]' : 'text-white/60'}`}>
              <div>{DAYS[day.getDay()]}</div>
              <div className={`text-lg font-semibold ${isToday ? 'text-[#c8ff00]' : 'text-white'}`}>
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)]">
        {HOURS.map(hour => (
          <>
            {/* Hour label */}
            <div key={`label-${hour}`} className="text-right pr-3 py-2 text-xs text-white/30 border-b border-white/5">
              {hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
            </div>

            {/* Day slots */}
            {days.map((day, dayIdx) => {
              const key        = slotKey(dayIdx, hour)
              const slotPosts  = getPostsForSlot(day, hour)
              const isOver     = dragOver === key

              return (
                <div
                  key={key}
                  className={`min-h-[48px] border-b border-l border-white/5 p-1 transition-colors ${isOver ? 'bg-[#c8ff00]/5' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(key) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, day, hour)}
                >
                  {slotPosts.map(post => (
                    <CalendarEvent
                      key={post.id}
                      post={post}
                      onClick={() => onEdit(post)}
                    />
                  ))}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}

function CalendarEvent({ post, onClick }: { post: PublishedPost; onClick: () => void }) {
  const colorClass = PLATFORM_COLORS[post.platform] ?? 'bg-white/10 border-white/20 text-white/70'

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('postId', post.id)}
      onClick={onClick}
      className={`text-xs px-1.5 py-0.5 rounded border cursor-pointer truncate mb-0.5 ${colorClass}`}
      title={post.content}
    >
      <span className="capitalize mr-1">{post.platform}</span>
      <span className="opacity-70">{post.content.slice(0, 30)}…</span>
    </div>
  )
}
