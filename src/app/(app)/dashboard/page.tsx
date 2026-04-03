import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Sparkles, Clock, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Plan, GenerationResult } from '@/types/generation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, historyRes] = await Promise.all([
    supabase.from('profiles').select('plan, full_name, generations_used').eq('id', user.id).single(),
    supabase.from('generations').select('id, content_input, tone, created_at, result')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  const profile  = profileRes.data
  const plan     = (profile?.plan ?? 'free') as Plan
  const history  = historyRes.data ?? []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#e8e8e8] font-syne">
          {profile?.full_name ? `Hey, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="text-sm text-[#555] mt-1">Here's what's been happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Sparkles}
          label="Generations today"
          value={String(profile?.generations_used ?? 0)}
          sub={plan === 'agency' ? 'Unlimited' : `of ${plan === 'pro' ? 100 : 3} today`}
        />
        <StatCard
          icon={Clock}
          label="Total generations"
          value={String(history.length)}
          sub="in history"
        />
        <StatCard
          icon={TrendingUp}
          label="Current plan"
          value={plan.charAt(0).toUpperCase() + plan.slice(1)}
          sub={plan === 'free' ? 'Upgrade for more' : 'Active'}
          accentValue={plan !== 'free'}
        />
      </div>

      {/* Recent generations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#e8e8e8] font-syne">Recent</h2>
          {plan !== 'free' && (
            <Link href="/history" className="text-xs text-[#555] hover:text-[#888] transition-colors">
              View all →
            </Link>
          )}
        </div>

        {history.length === 0 ? (
          <div className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-8 text-center">
            <p className="text-sm text-[#555] mb-3">No generations yet.</p>
            <Link href="/generate" className="text-sm text-[#c8ff00] hover:underline inline-flex items-center gap-1">
              Start generating <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((gen) => {
              const result = gen.result as unknown as GenerationResult
              return (
                <Link
                  key={gen.id}
                  href={`/generate?restore=${gen.id}`}
                  className="group flex items-start justify-between gap-4 rounded-[10px] border border-[#1a1a1a] bg-[#0c0c0c] p-4 hover:border-[#2a2a2a] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e8e8e8] truncate">
                      {gen.content_input.slice(0, 70)}{gen.content_input.length > 70 ? '…' : ''}
                    </p>
                    <p className="text-[10px] text-[#444] mt-1">{formatDate(gen.created_at)} · {gen.tone}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#333] group-hover:text-[#c8ff00] shrink-0 mt-0.5 transition-colors" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {plan === 'free' && (
        <div className="mt-6 rounded-[14px] border border-[#c8ff0022] bg-[#c8ff0008] p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#e8e8e8]">Upgrade to Pro for $12/month</p>
            <p className="text-xs text-[#555] mt-0.5">All 7 formats, Brand Voice, 100 generations/day, publishing</p>
          </div>
          <Link href="/settings" className="shrink-0 text-sm text-[#c8ff00] hover:underline">
            Upgrade →
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, sub, accentValue,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  accentValue?: boolean
}) {
  return (
    <div className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
      <Icon className="h-4 w-4 text-[#444] mb-3" />
      <p className="text-xs text-[#555] mb-1">{label}</p>
      <p className={`text-2xl font-bold font-syne ${accentValue ? 'text-[#c8ff00]' : 'text-[#e8e8e8]'}`}>{value}</p>
      <p className="text-xs text-[#444] mt-0.5">{sub}</p>
    </div>
  )
}
