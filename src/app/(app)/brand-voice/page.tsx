import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandVoicePageClient } from './client'
import { PLAN_FEATURES } from '@/types/billing'
import type { Plan } from '@/types/generation'

export default async function BrandVoicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan     = (profile?.plan ?? 'free') as Plan
  const maxSlots = PLAN_FEATURES[plan].brandVoiceSlots

  if (plan === 'free') redirect('/generate')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#e8e8e8] font-syne">Brand Voice</h1>
        <p className="text-sm text-[#555] mt-1">
          Paste samples of your writing. We'll learn your style and mirror it across all formats.
        </p>
      </div>
      <BrandVoicePageClient maxSlots={maxSlots} />
    </div>
  )
}
