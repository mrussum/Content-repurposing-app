'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Thin wrapper — initializes Posthog once and tracks page views.
// autocapture is disabled; all events are captured manually per CLAUDE.md §11.
export function PosthogProvider({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return // no-op in dev without the key

    import('posthog-js').then(({ default: posthog }) => {
      if (!posthog.__loaded) {
        posthog.init(key, {
          api_host:          'https://app.posthog.com',
          autocapture:       false,
          capture_pageview:  false, // we capture manually below
          persistence:       'localStorage',
        })
      }

      posthog.capture('$pageview', { path: pathname })
    })
  }, [pathname, searchParams])

  return <>{children}</>
}

// Typed capture helper used throughout the app
export async function track(event: string, props?: Record<string, unknown>) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  const { default: posthog } = await import('posthog-js')
  posthog.capture(event, props)
}
