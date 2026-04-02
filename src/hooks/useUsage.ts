'use client'

import useSWR from 'swr'
import type { UsageInfo } from '@/types/generation'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useUsage() {
  const { data, error, isLoading, mutate } = useSWR<UsageInfo>(
    '/api/usage',
    fetcher,
    { refreshInterval: 30_000 }
  )

  return {
    usage:     data ?? null,
    isLoading,
    isError:   !!error,
    refresh:   mutate,
  }
}
