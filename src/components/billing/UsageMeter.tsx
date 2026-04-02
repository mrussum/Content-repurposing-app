'use client'

import Link from 'next/link'
import { useUsage } from '@/hooks/useUsage'

export function UsageMeter() {
  const { usage, isLoading } = useUsage()

  if (isLoading || !usage) {
    return <div className="h-6 w-32 animate-pulse rounded bg-[#141414]" />
  }

  const { used, limit, plan } = usage
  const isUnlimited = limit === Infinity
  const pct         = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const isWarning   = !isUnlimited && pct >= 66

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs text-[#888]">
          {isUnlimited ? (
            <span className="text-[#c8ff00]">Unlimited</span>
          ) : (
            <>
              <span className={isWarning ? 'text-[#fb923c]' : 'text-[#e8e8e8]'}>{used}</span>
              <span className="text-[#444]"> / {limit}</span>
            </>
          )}
          <span className="ml-1 text-[#444]">today</span>
        </p>
      </div>

      {!isUnlimited && (
        <div className="w-20 h-1.5 rounded-full bg-[#141414] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: pct >= 100 ? '#ff7070' : pct >= 66 ? '#fb923c' : '#c8ff00',
            }}
          />
        </div>
      )}

      {plan === 'free' && isWarning && (
        <Link
          href="/settings?tab=billing"
          className="text-xs text-[#c8ff00] hover:underline whitespace-nowrap"
        >
          Upgrade
        </Link>
      )}
    </div>
  )
}
