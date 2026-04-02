'use client'

import Link from 'next/link'
import { LogOut, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { UsageMeter } from '@/components/billing/UsageMeter'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  plan: 'free' | 'pro' | 'agency'
  email: string
}

export function Header({ plan, email }: HeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const { createClient: createSupabaseClient } = await import('@/lib/supabase/client')
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-[#111111] bg-[#060606]/90 backdrop-blur-sm px-4 gap-4">
      <Link href="/generate" className="flex items-center gap-2 mr-4">
        <span className="text-[#c8ff00] font-bold text-lg font-syne tracking-tight">CS</span>
        <span className="text-[#e8e8e8] font-semibold font-syne text-sm hidden sm:block">
          Content Studio
        </span>
      </Link>

      <div className="flex-1" />

      <UsageMeter />

      {plan !== 'free' && (
        <Badge variant="pro" className="hidden sm:inline-flex">
          {plan === 'agency' ? 'Agency' : 'Pro'}
        </Badge>
      )}

      <div className="flex items-center gap-1">
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#555] hover:text-[#888] hover:bg-[#141414] transition-colors"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>

        <button
          onClick={handleSignOut}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#555] hover:text-[#888] hover:bg-[#141414] transition-colors"
          title={`Sign out (${email})`}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
