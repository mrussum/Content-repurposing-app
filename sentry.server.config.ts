import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV === 'production',

  // Never log user content to Sentry in production
  beforeSend(event) {
    if (process.env.NODE_ENV === 'production') {
      // Strip request body from events to avoid leaking user content
      if (event.request) delete event.request.data
    }
    return event
  },
})
