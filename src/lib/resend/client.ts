import { Resend } from 'resend'

// Lazy — instantiated on first use so build doesn't fail without env vars
let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM = () => process.env.RESEND_FROM_EMAIL ?? 'hello@contentstudio.pro'

export async function sendWelcomeEmail(email: string, name?: string | null): Promise<void> {
  await getResend().emails.send({
    from:    FROM(),
    to:      email,
    subject: 'Welcome to Content Studio Pro 🎉',
    text: `Hey ${name ?? 'there'},

You're now on Pro. Here's how to get the most out of it:

1. Set up your Brand Voice — paste 2-3 samples of your best writing and we'll learn your style.
2. Generate your first piece of content.
3. Use per-format regeneration to fine-tune any output.

If you have any questions, reply to this email.

— The Content Studio Pro team`,
  })
}

export async function sendCancellationEmail(email: string, name?: string | null): Promise<void> {
  await getResend().emails.send({
    from:    FROM(),
    to:      email,
    subject: 'Your Content Studio Pro subscription has ended',
    text: `Hey ${name ?? 'there'},

Your Pro subscription has been cancelled. You've been moved back to the Free plan (3 generations/day).

If you cancelled by mistake or want to come back, you can resubscribe anytime at contentstudio.pro/settings.

Thanks for trying Pro.

— The Content Studio Pro team`,
  })
}
