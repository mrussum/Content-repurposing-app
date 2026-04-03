'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InstagramSlide } from '@/types/generation'

// Accent color per slide type
const SLIDE_COLORS: Record<InstagramSlide['type'], { bg: string; badge: string; text: string }> = {
  hook:    { bg: '#c8ff0011', badge: '#c8ff0033', text: '#c8ff00' },
  problem: { bg: '#ff707011', badge: '#ff707033', text: '#ff7070' },
  insight: { bg: '#60b4ff11', badge: '#60b4ff33', text: '#60b4ff' },
  data:    { bg: '#fb923c11', badge: '#fb923c33', text: '#fb923c' },
  tip:     { bg: '#4ade8011', badge: '#4ade8033', text: '#4ade80' },
  cta:     { bg: '#c8ff0011', badge: '#c8ff0033', text: '#c8ff00' },
}

interface InstagramCarouselProps {
  slides: InstagramSlide[]
}

export function InstagramCarousel({ slides }: InstagramCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [copied,  setCopied]  = useState(false)

  const slide  = slides[current]
  const colors = SLIDE_COLORS[slide.type]

  function prev() { setCurrent((c) => Math.max(0, c - 1)) }
  function next() { setCurrent((c) => Math.min(slides.length - 1, c + 1)) }

  async function copySlide() {
    await navigator.clipboard.writeText(`${slide.headline}\n\n${slide.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Slide */}
      <div
        className="relative w-full rounded-[14px] border border-[#1a1a1a] flex flex-col justify-between p-6 transition-colors"
        style={{
          aspectRatio:    '1 / 1',
          maxWidth:       'clamp(280px, 100%, 480px)',
          backgroundColor: colors.bg,
        }}
      >
        {/* Type badge */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: colors.badge, color: colors.text }}
          >
            {slide.type}
          </span>
          <button
            onClick={copySlide}
            className="flex items-center gap-1 text-[10px] text-[#444] hover:text-[#888] transition-colors"
          >
            {copied ? <><Check className="h-3 w-3 text-[#4ade80]" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">
          <p
            className="text-2xl font-bold leading-tight font-syne"
            style={{ color: '#e8e8e8' }}
          >
            {slide.headline}
          </p>
          <p className="text-sm text-[#888] leading-relaxed">{slide.body}</p>
        </div>

        {/* Slide number */}
        <span className="text-[10px] text-[#444]">
          {slide.slide} / {slides.length}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={prev}
          disabled={current === 0}
          className="h-8 w-8 flex items-center justify-center rounded-md border border-[#1a1a1a] text-[#555] hover:text-[#888] hover:border-[#2a2a2a] disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                i === current ? 'w-4 bg-[#c8ff00]' : 'w-1.5 bg-[#2a2a2a]'
              )}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="h-8 w-8 flex items-center justify-center rounded-md border border-[#1a1a1a] text-[#555] hover:text-[#888] hover:border-[#2a2a2a] disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 w-full justify-center">
        {slides.map((s, i) => {
          const c = SLIDE_COLORS[s.type]
          return (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'shrink-0 h-10 w-10 rounded-[6px] border text-[9px] font-bold transition-all',
                i === current ? 'border-[#c8ff00]' : 'border-[#1a1a1a] opacity-60 hover:opacity-100'
              )}
              style={{ backgroundColor: c.bg, color: c.text }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
