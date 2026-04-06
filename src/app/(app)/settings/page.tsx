import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './client'
import type { Plan } from '@/types/generation'

export const metadata = { title: 'Settings — Content Studio Pro' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, full_name, stripe_subscription_id, buffer_access_token, twitter_access_token, linkedin_access_token, notion_access_token')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-[#e8e8e8] font-syne mb-8">Settings</h1>
      <SettingsClient
        plan={(profile?.plan ?? 'free') as Plan}
        email={profile?.email ?? user.email ?? ''}
        name={profile?.full_name ?? null}
        hasSubscription={!!profile?.stripe_subscription_id}
        bufferConnected={!!profile?.buffer_access_token}
        twitterConnected={!!profile?.twitter_access_token}
        linkedinConnected={!!profile?.linkedin_access_token}
        notionConnected={!!profile?.notion_access_token}
      />
    </div>
  )
}
