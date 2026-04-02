import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HistorySidebar } from '@/components/studio/HistorySidebar'
import type { Plan } from '@/types/generation'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as Plan

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-[#e8e8e8] font-syne mb-6">Generation History</h1>
      <HistorySidebar plan={plan} />
    </div>
  )
}
