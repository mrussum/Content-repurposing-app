'use client'

import { useState } from 'react'
import { ExternalLink, Check, Link2Off } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UpgradeModal } from '@/components/billing/UpgradeModal'
import { PLANS } from '@/lib/stripe/plans'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types/generation'

interface SettingsClientProps {
  plan:             Plan
  email:            string
  name:             string | null
  hasSubscription:  boolean
  bufferConnected:  boolean
  twitterConnected: boolean
  linkedinConnected:boolean
  notionConnected:  boolean
}

export function SettingsClient({
  plan, email, name, hasSubscription,
  bufferConnected, twitterConnected, linkedinConnected, notionConnected,
}: SettingsClientProps) {
  const [showUpgrade,   setShowUpgrade]   = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const currentPlan = PLANS[plan]
  const isPro       = plan === 'pro' || plan === 'agency'

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
        <h2 className="text-sm font-semibold text-[#e8e8e8] font-syne mb-4">Plan &amp; Billing</h2>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#e8e8e8] font-medium">{currentPlan.name}</span>
              {plan !== 'free' && <Badge variant="pro">{plan === 'agency' ? 'Agency' : 'Pro'}</Badge>}
            </div>
            <p className="text-xs text-[#555] mt-0.5">
              {plan === 'free' ? '3 generations / day' : plan === 'pro' ? '100 generations / day' : 'Unlimited generations'}
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
        <div className="flex flex-col divide-y divide-[#111]">

          <IntegrationRow
            name="Twitter / X"
            description="Post threads directly from Content Studio"
            connected={twitterConnected}
            connectHref="/api/publish/twitter/oauth"
            proRequired={!isPro}
            onUpgrade={() => setShowUpgrade(true)}
          />

          <IntegrationRow
            name="LinkedIn"
            description="Publish posts directly to your profile"
            connected={linkedinConnected}
            connectHref="/api/publish/linkedin/oauth"
            proRequired={!isPro}
            onUpgrade={() => setShowUpgrade(true)}
          />

          <IntegrationRow
            name="Buffer"
            description="Schedule posts across multiple platforms"
            connected={bufferConnected}
            connectHref="/api/buffer/oauth"
            proRequired={!isPro}
            onUpgrade={() => setShowUpgrade(true)}
          />

          <IntegrationRow
            name="Notion"
            description="Export blog outlines as Notion pages"
            connected={notionConnected}
            connectHref="/api/integrations/notion"
            proRequired={!isPro}
            onUpgrade={() => setShowUpgrade(true)}
          />

        </div>
      </section>

      {/* Agency API keys link */}
      {plan === 'agency' && (
        <section className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#e8e8e8]">API Access</p>
              <p className="text-xs text-[#555] mt-0.5">Manage keys for the Content Studio API</p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <a href="/settings/api">Manage keys</a>
            </Button>
          </div>
        </section>
      )}

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        trigger="header"
      />
    </div>
  )
}

interface IntegrationRowProps {
  name:        string
  description: string
  connected:   boolean
  connectHref: string
  proRequired: boolean
  onUpgrade:   () => void
}

function IntegrationRow({ name, description, connected, connectHref, proRequired, onUpgrade }: IntegrationRowProps) {
  return (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm text-[#e8e8e8]">{name}</p>
        <p className="text-xs text-[#555] mt-0.5">{description}</p>
      </div>

      {connected ? (
        <span className={cn('text-xs text-[#4ade80] flex items-center gap-1')}>
          <Check className="h-3 w-3" /> Connected
        </span>
      ) : proRequired ? (
        <button
          onClick={onUpgrade}
          className="flex items-center gap-1 text-xs text-[#c8ff00] hover:underline transition-colors"
        >
          <Link2Off className="h-3 w-3" /> Upgrade to connect
        </button>
      ) : (
        <Button variant="secondary" size="sm" asChild>
          <a href={connectHref}>
            Connect <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      )}
    </div>
  )
}
