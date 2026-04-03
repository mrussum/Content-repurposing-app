import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample 10% of transactions in production to control costs
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Don't alert on expected auth failures
  ignoreErrors: ['AuthError', 'NEXT_NOT_FOUND'],

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
})
