'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, Mic, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  {
    icon:    Sparkles,
    title:   'Generate 7 formats in 30 seconds',
    body:    'Paste any article, transcript, or notes. Get a Twitter thread, LinkedIn post, Instagram carousel, blog outline, newsletter, summary, and key quotes — instantly.',
  },
  {
    icon:    Mic,
    title:   'It sounds like you',
    body:    'Brand Voice learns from your writing samples and mirrors your vocabulary, rhythm, and energy across every format. Paste 1-2 samples below to set it up now (you can skip this).',
  },
  {
    icon:    Zap,
    title:   'Ready to go',
    body:    "That's it. Paste your first piece of content and see the magic.",
  },
]

export function OnboardingClient({ name }: { name: string | null }) {
  const router = useRouter()
  const [step,   setStep]   = useState(0)
  const [sample, setSample] = useState('')
  const [saving, setSaving] = useState(false)

  const current = STEPS[step]
  const Icon    = current.icon

  async function handleNext() {
    if (step === 1 && sample.trim().length >= 10) {
      // Save voice sample (fire and forget — non-blocking for UX)
      fetch('/api/brand-voice', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: 'My Brand Voice', samples: [sample] }),
      }).catch(() => null)
    }

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
      return
    }

    // Final step — mark onboarded
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ has_onboarded: true })
        .eq('id', user.id)
    }
    router.push('/generate')
  }

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-[#c8ff00]' : i < step ? 'w-3 bg-[#4ade80]' : 'w-3 bg-[#2a2a2a]'
              }`}
            />
          ))}
        </div>

        <div className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-8 animate-fade-in">
          <div className="flex items-center justify-center h-12 w-12 rounded-[10px] bg-[#c8ff0011] border border-[#c8ff0022] mb-6 mx-auto">
            <Icon className="h-5 w-5 text-[#c8ff00]" />
          </div>

          {step === 0 && name && (
            <p className="text-sm text-[#555] text-center mb-2">Welcome, {name.split(' ')[0]} 👋</p>
          )}

          <h2 className="text-xl font-bold text-[#e8e8e8] font-syne text-center mb-3">
            {current.title}
          </h2>
          <p className="text-sm text-[#555] text-center leading-relaxed mb-6">
            {current.body}
          </p>

          {step === 1 && (
            <Textarea
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              placeholder="Paste a tweet, LinkedIn post, or paragraph from a blog you've written…"
              className="min-h-[120px] mb-4 text-sm"
            />
          )}

          <Button
            onClick={handleNext}
            disabled={saving}
            className="w-full font-syne"
          >
            {step === STEPS.length - 1 ? (
              saving ? 'Setting up…' : 'Start generating'
            ) : (
              <span className="flex items-center gap-2">
                {step === 1 && sample.trim().length < 10 ? 'Skip for now' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
