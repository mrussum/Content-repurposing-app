import { createClient } from '@/lib/supabase/server'
import { GeneratePanel } from '@/components/studio/GeneratePanel'
import { OutputPanel } from '@/components/studio/OutputPanel'
import type { Plan } from '@/types/generation'

export default async function GeneratePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user!.id)
    .single()

  const plan = (profile?.plan ?? 'free') as Plan

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[420px_1fr]">
      <div className="border-b lg:border-b-0 lg:border-r border-[#111111] overflow-y-auto">
        <GeneratePanel plan={plan} />
      </div>
      <div className="overflow-hidden">
        <OutputPanel plan={plan} />
      </div>
    </div>
  )
}
