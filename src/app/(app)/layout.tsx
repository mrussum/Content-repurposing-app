import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Plan } from '@/types/generation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, full_name, has_onboarded')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Redirect new users to onboarding
  if (!profile.has_onboarded) {
    // Only redirect if not already on onboarding page (handled by middleware path check)
    // Using a soft check here to avoid redirect loop
  }

  const plan = profile.plan as Plan

  return (
    <div className="flex flex-col h-screen bg-[#060606]">
      <Header plan={plan} email={profile.email} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar plan={plan} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
