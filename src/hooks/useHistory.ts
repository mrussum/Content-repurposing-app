'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Generation } from '@/types/generation'
import type { GenerationRow } from '@/types/database'

function rowToGeneration(row: GenerationRow): Generation {
  const result = row.result as unknown as Generation['result']
  return {
    id:           row.id,
    userId:       row.user_id,
    contentInput: row.content_input,
    result,
    tone:         row.tone as Generation['tone'],
    audience:     row.audience as Generation['audience'],
    brandVoiceId: row.brand_voice_id,
    wordCount:    row.word_count,
    createdAt:    row.created_at,
  }
}

async function fetchHistory(): Promise<Generation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error
  return (data ?? []).map(rowToGeneration)
}

export function useHistory() {
  const { data, error, isLoading, mutate } = useSWR<Generation[]>(
    'generations-history',
    fetchHistory
  )

  return {
    history:   data ?? [],
    isLoading,
    isError:   !!error,
    refresh:   mutate,
  }
}
