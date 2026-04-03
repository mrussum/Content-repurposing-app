import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingClient } from './client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('has_onboarded, plan, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.has_onboarded) redirect('/generate')

  return <OnboardingClient name={profile?.full_name ?? null} />
}
