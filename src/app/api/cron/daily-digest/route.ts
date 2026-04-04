import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'

// Vercel Cron: runs daily at 9am UTC (see vercel.json)
// Sends a digest email to Pro/Agency users who generated content in the last 7 days
export async function GET(req: NextRequest) {
  // Verify request comes from Vercel Cron (or local dev)
  const cronSecret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('cron_secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const service = await createAdminClient()

    // Find Pro/Agency users active in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: activeUsers, error } = await service
      .from('profiles')
      .select('id, email, full_name, plan, generations_used')
      .in('plan', ['pro', 'agency'])
      .gt('generations_used', 0)
      .gt('generations_reset_at', sevenDaysAgo)

    if (error) throw error

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    // Send digest emails via Resend
    const { getResend } = await import('@/lib/resend/client')
    const resend = getResend()
    let sent = 0

    for (const user of activeUsers) {
      try {
        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL ?? 'hello@contentstudio.pro',
          to:      user.email,
          subject: `Your content week in review — Content Studio Pro`,
          html:    buildDigestEmail(user.full_name ?? user.email, user.generations_used, user.plan),
        })
        sent++
      } catch (emailErr) {
        // Don't abort the whole run for one failed email
        Sentry.captureException(emailErr, { extra: { userId: user.id } })
      }
    }

    return NextResponse.json({ sent, total: activeUsers.length })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}

function buildDigestEmail(name: string, generationsUsed: number, plan: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background: #060606; color: #e8e8e8; padding: 40px 20px; max-width: 560px; margin: 0 auto;">
  <h1 style="font-size: 20px; color: #c8ff00; margin-bottom: 8px;">Hey ${name} 👋</h1>
  <p style="color: #888; font-size: 14px; margin-bottom: 24px;">Here's your Content Studio Pro weekly digest.</p>

  <div style="background: #0e0e0e; border: 1px solid #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <div style="font-size: 32px; font-weight: 700; color: #c8ff00;">${generationsUsed}</div>
    <div style="font-size: 13px; color: #666; margin-top: 4px;">generations this week</div>
  </div>

  <p style="font-size: 14px; color: #888; line-height: 1.6;">
    You're on the <strong style="color: #e8e8e8; text-transform: capitalize;">${plan}</strong> plan.
    Keep creating — consistency compounds.
  </p>

  <a href="${process.env.NEXT_PUBLIC_APP_URL}/generate"
     style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #c8ff00; color: #060606; font-weight: 600; border-radius: 8px; text-decoration: none; font-size: 14px;">
    Open Content Studio
  </a>

  <p style="margin-top: 40px; font-size: 11px; color: #333;">
    You're receiving this because you're a Content Studio Pro subscriber.
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #555;">Manage preferences</a>
  </p>
</body>
</html>
  `.trim()
}
