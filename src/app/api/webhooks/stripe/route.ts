import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, sendCancellationEmail } from '@/lib/resend/client'

// Must use req.text() — req.json() corrupts the body and breaks signature verification
export async function POST(req: Request) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Always return 200 — log errors to prevent Stripe retries on our bugs
  try {
    await handleEvent(event)
  } catch (err) {
    console.error('[stripe-webhook]', event.type, err)
  }

  return NextResponse.json({ received: true })
}

async function handleEvent(event: Stripe.Event) {
  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId  = session.metadata?.supabase_user_id
      const plan    = (session.metadata?.plan ?? 'pro') as 'pro' | 'agency'
      if (!userId) return

      await supabase
        .from('profiles')
        .update({
          plan,
          stripe_customer_id:      session.customer as string,
          stripe_subscription_id:  session.subscription as string,
        })
        .eq('id', userId)

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      if (profile) {
        await sendWelcomeEmail(profile.email, profile.full_name)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) return

      const status = sub.status
      const plan   = status === 'active' || status === 'trialing'
        ? (sub.metadata?.plan ?? 'pro') as 'pro' | 'agency'
        : 'free'

      await supabase
        .from('profiles')
        .update({ plan, stripe_subscription_id: sub.id })
        .eq('id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) return

      await supabase
        .from('profiles')
        .update({ plan: 'free', stripe_subscription_id: null })
        .eq('id', userId)

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      if (profile) {
        await sendCancellationEmail(profile.email, profile.full_name)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.warn('[stripe-webhook] Payment failed for customer:', invoice.customer)
      // Could send a payment failed email here in V1.5
      break
    }

    default:
      // Unhandled event type — ignore
      break
  }
}
