import * as Sentry from '@sentry/node'
import { fastifyIntegration, setupFastifyErrorHandler } from '@sentry/node'
import type { FastifyInstance } from 'fastify'

function tracesSampleRate(): number {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE?.trim()
  if (!raw) return 0
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0
}

export function initBackendSentry(): boolean {
  const dsn = process.env.SENTRY_DSN?.trim()
  if (!dsn) return false

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT?.trim() ||
      process.env.NODE_ENV ||
      'development',
    tracesSampleRate: tracesSampleRate(),
    integrations: [fastifyIntegration()],
  })
  return true
}

export function attachSentryToFastify(app: FastifyInstance): void {
  if (!process.env.SENTRY_DSN?.trim()) return

  setupFastifyErrorHandler(app, {
    shouldHandleError(_error, _request, reply) {
      const code = reply.statusCode
      return code >= 500 || code <= 299
    },
  })
}
