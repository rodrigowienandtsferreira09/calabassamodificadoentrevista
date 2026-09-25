import type { FastifyReply, FastifyRequest } from 'fastify'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { prisma } from './prisma'

const isProduction = process.env.NODE_ENV === 'production'
const JWT_SECRET = process.env.JWT_SECRET?.trim() || (isProduction ? '' : 'dev-only-jwt-secret')

if (isProduction && !JWT_SECRET) {
  throw new Error('JWT_SECRET obrigatório em produção.')
}

function accessExpiresIn(): string {
  return process.env.JWT_ACCESS_EXPIRES_IN?.trim() || '15m'
}

function accessExpiresInSeconds(): number {
  const raw = accessExpiresIn()
  const m = /^(\d+)m$/i.exec(raw)
  if (m) return parseInt(m[1], 10) * 60
  const h = /^(\d+)h$/i.exec(raw)
  if (h) return parseInt(h[1], 10) * 3600
  const d = /^(\d+)d$/i.exec(raw)
  if (d) return parseInt(d[1], 10) * 86400
  const num = Number(raw)
  if (Number.isFinite(num) && num > 0) return Math.floor(num)
  return 900
}

export type JwtPayload = {
  sub: string
  role: 'BUYER' | 'ADMIN'
  kind: 'access'
  sv: number
}

export function signAccessToken(userId: string, role: JwtPayload['role'], sessionVersion: number): string {
  const payload: JwtPayload = { sub: userId, role, kind: 'access', sv: sessionVersion }
  const signOpts: SignOptions = { expiresIn: accessExpiresInSeconds() }
  return jwt.sign(payload, JWT_SECRET, signOpts)
}

export function verifyAccessToken(token: string): JwtPayload {
  const p = jwt.verify(token, JWT_SECRET) as JwtPayload & { kind?: string; sv?: number }
  if (p.kind !== 'access') throw new Error('Invalid token type')
  if (typeof p.sv !== 'number') throw new Error('Invalid session')
  return p as JwtPayload
}

export async function resolveAccessToken(authHeader: string | undefined): Promise<JwtPayload | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const payload = verifyAccessToken(authHeader.slice(7))
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { sessionVersion: true, role: true },
    })
    if (!user || user.sessionVersion !== payload.sv) return null
    return {
      sub: payload.sub,
      role: user.role as JwtPayload['role'],
      kind: 'access',
      sv: user.sessionVersion,
    }
  } catch {
    return null
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const payload = await resolveAccessToken(request.headers.authorization)
  if (!payload) {
    return reply.status(401).send({ error: 'Não autorizado. Faça login novamente.' })
  }
  ;(request as FastifyRequest & { user: JwtPayload }).user = payload
}

export function requireRole(...roles: JwtPayload['role'][]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const u = (request as FastifyRequest & { user: JwtPayload }).user
    if (!u || !roles.includes(u.role)) {
      return reply.status(403).send({ error: 'Acesso negado.' })
    }
  }
}

export function getUserId(request: FastifyRequest): string {
  return (request as FastifyRequest & { user: JwtPayload }).user.sub
}

export function accessTokenExpiresInSeconds(): number {
  return accessExpiresInSeconds()
}
