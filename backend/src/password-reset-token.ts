import crypto from 'node:crypto'
import { prisma } from './prisma'

function pepper(): string {
  return process.env.PASSWORD_RESET_PEPPER?.trim() || process.env.JWT_SECRET || 'dev-only-pepper'
}

export function hashPasswordResetToken(raw: string): string {
  return crypto.createHash('sha256').update(`prt\0${raw}\0${pepper()}`, 'utf8').digest('hex')
}

function ttlMs(): number {
  const hours = Math.min(24, Math.max(1, Number(process.env.PASSWORD_RESET_HOURS || '1') || 1))
  return hours * 60 * 60 * 1000
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const raw = `prt_${crypto.randomBytes(32).toString('base64url')}`
  const tokenHash = hashPasswordResetToken(raw)
  const expiresAt = new Date(Date.now() + ttlMs())
  await prisma.passwordResetToken.deleteMany({ where: { userId } })
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  })
  return raw
}

export async function consumePasswordResetToken(raw: string): Promise<{ userId: string } | null> {
  const tokenHash = hashPasswordResetToken(raw.trim())
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  })
  if (!row) return null
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.passwordResetToken.delete({ where: { id: row.id } }).catch(() => {})
    return null
  }
  await prisma.passwordResetToken.delete({ where: { id: row.id } })
  return { userId: row.userId }
}
