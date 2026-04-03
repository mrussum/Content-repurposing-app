'use client'

import { useState } from 'react'
import { ExternalLink, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UpgradeModal } from '@/components/billing/UpgradeModal'
import { PLANS } from '@/lib/stripe/plans'
import type { Plan } from '@/types/generation'

interface SettingsClientProps {
  plan:            Plan
  email:           string
  name:            string | null
  hasSubscription: boolean
  bufferConnected: boolean
}

export function SettingsClient({ plan, email, name, hasSubscription, bufferConnected }: SettingsClientProps) {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const currentPlan = PLANS[plan]

  async function openBillingPortal() {
    setPortalLoading(true)
    const res  = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json() as { url?: string }
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Account */}
      <section className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
        <h2 className="text-sm font-semibold text-[#e8e8e8] font-syne mb-4">Account</h2>
        <dl className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <dt className="text-[#555]">Email</dt>
            <dd className="text-[#888]">{email}</dd>
          </div>
          {name && (
            <div className="flex justify-between text-sm">
              <dt className="text-[#555]">Name</dt>
              <dd className="text-[#888]">{name}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Billing */}
      <section className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
        <h2 className="text-sm font-semibold text-[#e8e8e8] font-syne mb-4">Plan & Billing</h2>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#e8e8e8] font-medium">{currentPlan.name}</span>
              {plan !== 'free' && <Badge variant="pro">{plan === 'agency' ? 'Agency' : 'Pro'}</Badge>}
            </div>
            <p className="text-xs text-[#555] mt-0.5">
              {plan === 'free'
                ? '3 generations / day'
                : plan === 'pro'
                ? '100 generations / day'
                : 'Unlimited generations'}
            </p>
          </div>

          {plan === 'free' ? (
            <Button onClick={() => setShowUpgrade(true)} size="sm">Upgrade</Button>
          ) : hasSubscription ? (
            <Button variant="secondary" size="sm" onClick={openBillingPortal} disabled={portalLoading}>
              {portalLoading ? 'Loading…' : 'Manage billing'}
            </Button>
          ) : null}
        </div>

        {plan !== 'free' && (
          <ul className="flex flex-col gap-1.5">
            {currentPlan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-[#555]">
                <Check className="h-3 w-3 text-[#4ade80] shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Integrations */}
      <section className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
        <h2 className="text-sm font-semibold text-[#e8e8e8] font-syne mb-4">Integrations</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#e8e8e8]">Buffer</p>
            <p className="text-xs text-[#555] mt-0.5">Publish to Twitter and LinkedIn</p>
          </div>

          {bufferConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#4ade80] flex items-center gap-1">
                <Check className="h-3 w-3" /> Connected
              </span>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              asChild
              disabled={plan === 'free'}
            >
              <a href="/api/buffer/oauth">
                Connect <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </section>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        trigger="header"
      />
    </div>
  )
}
