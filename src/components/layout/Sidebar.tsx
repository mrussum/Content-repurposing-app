'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, History, Mic, Settings, Lock, Calendar, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/generate',    label: 'Generate',    icon: Sparkles,       proRequired: false },
  { href: '/history',     label: 'History',     icon: History,        proRequired: true  },
  { href: '/brand-voice', label: 'Brand Voice', icon: Mic,            proRequired: true  },
  { href: '/calendar',    label: 'Calendar',    icon: Calendar,       proRequired: true  },
  { href: '/templates',   label: 'Templates',   icon: LayoutTemplate, proRequired: false },
  { href: '/settings',    label: 'Settings',    icon: Settings,       proRequired: false },
]

interface SidebarProps {
  plan: 'free' | 'pro' | 'agency'
}

export function Sidebar({ plan }: SidebarProps) {
  const pathname = usePathname()
  const isPro    = plan === 'pro' || plan === 'agency'

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-14 border-r border-[#111111] bg-[#060606] py-4 gap-1">
        {NAV.map(({ href, label, icon: Icon, proRequired }) => {
          const isActive  = pathname.startsWith(href)
          const isLocked  = proRequired && !isPro

          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'relative flex h-10 w-10 mx-auto items-center justify-center rounded-md transition-colors',
                isActive
                  ? 'text-[#c8ff00] bg-[#c8ff0011]'
                  : 'text-[#444] hover:text-[#888] hover:bg-[#141414]',
                isLocked && 'opacity-50'
              )}
            >
              <Icon className="h-5 w-5" />
              {isLocked && (
                <Lock className="absolute bottom-1 right-1 h-2.5 w-2.5 text-[#555]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-[#111111] bg-[#060606]/95 backdrop-blur-sm">
        {NAV.map(({ href, label, icon: Icon, proRequired }) => {
          const isActive = pathname.startsWith(href)
          const isLocked = proRequired && !isPro

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] transition-colors',
                isActive ? 'text-[#c8ff00]' : 'text-[#444]',
                isLocked && 'opacity-50'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
