'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { BrandVoice } from '@/types/generation'
import type { BrandVoiceRow } from '@/types/database'

function rowToVoice(row: BrandVoiceRow): BrandVoice {
  return {
    id:        row.id,
    userId:    row.user_id,
    name:      row.name,
    samples:   row.samples,
    summary:   row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function fetchBrandVoices(): Promise<BrandVoice[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('brand_voices')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(rowToVoice)
}

export function useBrandVoice() {
  const { data, error, isLoading, mutate } = useSWR<BrandVoice[]>(
    'brand-voices',
    fetchBrandVoices
  )

  return {
    voices:    data ?? [],
    isLoading,
    isError:   !!error,
    refresh:   mutate,
  }
}
