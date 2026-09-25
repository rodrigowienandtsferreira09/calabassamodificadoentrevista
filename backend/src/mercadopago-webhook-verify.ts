import crypto from 'node:crypto'

export function parseMercadoPagoSignatureHeader(
  xSignature: string | undefined
): { ts: string; v1: string } | null {
  if (!xSignature) return null
  let ts: string | undefined
  let v1: string | undefined
  for (const part of xSignature.split(',')) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    const key = part.slice(0, eq).trim()
    const value = part.slice(eq + 1).trim()
    if (key === 'ts') ts = value
    if (key === 'v1') v1 = value
  }
  if (!ts || !v1) return null
  return { ts, v1 }
}

function normalizeMercadoPagoDataId(dataId: string): string {
  const s = String(dataId).trim()
  if (/^[a-fA-F0-9]+$/.test(s)) return s.toLowerCase()
  return s
}

export function mercadoPagoWebhookManifestParts(opts: {
  dataId: string | null | undefined
  xRequestId: string | undefined
  ts: string
}): string {
  const parts: string[] = []
  if (opts.dataId != null && String(opts.dataId).trim() !== '') {
    parts.push(`id:${normalizeMercadoPagoDataId(String(opts.dataId))}`)
  }
  if (opts.xRequestId != null && String(opts.xRequestId).trim() !== '') {
    parts.push(`request-id:${String(opts.xRequestId).trim()}`)
  }
  parts.push(`ts:${opts.ts}`)
  return `${parts.join(';')};`
}

export function verifyMercadoPagoWebhookSignature(opts: {
  secret: string
  xSignature: string | undefined
  xRequestId: string | undefined
  dataId: string | null | undefined
  maxSkewSec?: number
}): boolean {
  const parsed = parseMercadoPagoSignatureHeader(opts.xSignature)
  if (!parsed) return false

  const tsNum = Number(parsed.ts)
  if (Number.isFinite(tsNum)) {
    const skew = opts.maxSkewSec ?? 600
    const nowSec = Math.floor(Date.now() / 1000)
    const tsSec = tsNum > 1e12 ? Math.floor(tsNum / 1000) : tsNum
    if (Math.abs(nowSec - tsSec) > skew) return false
  }

  const manifest = mercadoPagoWebhookManifestParts({
    dataId: opts.dataId,
    xRequestId: opts.xRequestId,
    ts: parsed.ts,
  })

  const expected = crypto.createHmac('sha256', opts.secret).update(manifest).digest('hex')
  try {
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(parsed.v1, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
