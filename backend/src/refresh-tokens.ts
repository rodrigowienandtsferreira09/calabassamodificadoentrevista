import crypto from 'node:crypto'
import { prisma } from './prisma'

function pepper(): string {
  return process.env.REFRESH_TOKEN_PEPPER?.trim() || process.env.JWT_SECRET || 'dev-only-pepper'
}

export function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(`${raw}\0${pepper()}`, 'utf8').digest('hex')
}

export function refreshTokenTtlMs(): number {
  const days = Math.min(90, Math.max(1, Number(process.env.JWT_REFRESH_DAYS || '14') || 14))
  return days * 24 * 60 * 60 * 1000
}

export async function createRefreshTokenForUser(userId: string): Promise<string> {
  const raw = `rt_${crypto.randomBytes(32).toString('base64url')}`
  const tokenHash = hashRefreshToken(raw)
  const expiresAt = new Date(Date.now() + refreshTokenTtlMs())
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  })
  return raw
}

export async function findValidRefreshUser(raw: string): Promise<{ userId: string; id: string } | null> {
  const tokenHash = hashRefreshToken(raw)
  const row = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  })
  if (!row) return null
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.refreshToken.delete({ where: { id: row.id } }).catch(() => {})
    return null
  }
  return { userId: row.userId, id: row.id }
}

export async function rotateRefreshToken(oldRowId: string, userId: string): Promise<string> {
  await prisma.refreshToken.delete({ where: { id: oldRowId } })
  return createRefreshTokenForUser(userId)
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } })
}
