import { Prisma } from '@prisma/client'
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import type { ZodError, ZodTypeAny, z } from 'zod'
import { authenticate, requireRole } from './jwt'

export class BadRequestError extends Error {}

class ValidationError extends Error {
  constructor(readonly zodError: ZodError) {
    super('Dados inválidos.')
  }
}

export function parseBody<T extends ZodTypeAny>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data)
  if (!result.success) throw new ValidationError(result.error)
  return result.data
}

export const authenticated = { preHandler: [authenticate] }
export const adminOnly = { preHandler: [authenticate, requireRole('ADMIN')] }

export function authRateLimit(max: number, timeWindow: string) {
  return {
    rateLimit: {
      max,
      timeWindow,
      errorResponseBuilder: (_req: unknown, context: { statusCode: number }) =>
        Object.assign(new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.'), {
          statusCode: context.statusCode,
        }),
    },
  }
}

export function errorHandler(error: FastifyError, _request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ValidationError) {
    return reply.status(400).send({ error: error.message, details: error.zodError.flatten().fieldErrors })
  }
  if (error instanceof BadRequestError) return reply.status(400).send({ error: error.message })
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return reply.status(404).send({ error: 'Registro não encontrado.' })
  }
  if (error.statusCode === 429) return reply.status(429).send({ error: error.message })
  return reply.send(error)
}

export function emptyToNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined
  return value === '' || value === null ? null : value
}
