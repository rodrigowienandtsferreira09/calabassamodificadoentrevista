import crypto from 'node:crypto'

const PREFIX = 'v1'

function resolveKey(envVar: string, devFallbackLabel: string): Buffer {
  const raw = process.env[envVar]?.trim()
  if (raw) {
    for (const encoding of ['base64', 'hex'] as const) {
      const buf = Buffer.from(raw, encoding)
      if (buf.length === 32) return buf
    }
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn(`[field-crypto] ${envVar} ausente/inválida em produção — usando chave derivada de fallback (NÃO RECOMENDADO).`)
  }
  return crypto.createHash('sha256').update(`dev-only:${devFallbackLabel}:${process.env.JWT_SECRET || 'dev'}`).digest()
}

function encryptionKey(): Buffer {
  return resolveKey('FIELD_ENCRYPTION_KEY', 'field-encryption-key')
}

function lookupKey(): Buffer {
  return resolveKey('FIELD_HASH_PEPPER', 'field-hash-pepper')
}

export function encryptField(plain: string | null | undefined): string | null {
  if (plain == null) return null
  const value = String(plain)
  if (value === '') return null
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':')
}

export function decryptField(value: string | null | undefined): string | null {
  if (value == null || value === '') return null
  const parts = value.split(':')
  if (parts.length !== 4 || parts[0] !== PREFIX) return value
  try {
    const [, ivB64, tagB64, dataB64] = parts
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const plain = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
    return plain.toString('utf8')
  } catch {
    return null
  }
}

export function hashForLookup(plain: string): string {
  return crypto.createHmac('sha256', lookupKey()).update(String(plain)).digest('hex')
}

export function isEncryptedField(value: string | null | undefined): boolean {
  return !!value && value.startsWith(`${PREFIX}:`)
}
