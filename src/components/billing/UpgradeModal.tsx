'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/stripe/plans'

interface UpgradeModalProps {
  open:    boolean
  onClose: () => void
  trigger?: 'limit' | 'feature' | 'header'
  feature?: string
}

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  const [loading, setLoading] = useState<'pro' | 'agency' | null>(null)

  async function handleUpgrade(plan: 'pro' | 'agency') {
    setLoading(plan)
    try {
      const res  = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {feature ? `${feature} requires Pro` : 'Upgrade to unlock more'}
          </DialogTitle>
          <DialogDescription>
            Choose a plan to continue generating great content.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {(['pro', 'agency'] as const).map((key) => {
            const plan = PLANS[key]
            return (
              <div
                key={key}
                className="rounded-[14px] border border-[#1a1a1a] bg-[#0e0e0e] p-5 flex flex-col gap-4"
              >
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#e8e8e8] font-syne">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-[#555]">/month</span>
                  </div>
                  <p className="mt-1 font-semibold text-[#e8e8e8] font-syne">{plan.name}</p>
                </div>

                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#888]">
                      <Check className="h-4 w-4 shrink-0 text-[#c8ff00] mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(key)}
                  disabled={!!loading}
                  variant={key === 'pro' ? 'default' : 'secondary'}
                  className="w-full"
                >
                  {loading === key ? 'Redirecting…' : `Get ${plan.name}`}
                </Button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
