import { MercadoPagoConfig, Preference } from 'mercadopago'

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

const INVALID_BASE_HOSTS = ['seu-dominio', 'example.com', 'localhost', '127.0.0.1']

function normalizeHttpsBase(u: string): string {
  const trimmed = u.replace(/\/$/, '')
  if (!trimmed.startsWith('https://')) {
    console.warn('URL base do backend deve ser HTTPS público (ex.: Railway). Ignorando para a preferência MP.')
    return ''
  }
  if (INVALID_BASE_HOSTS.some((x) => trimmed.includes(x))) {
    console.warn('URL base parece inválida/local. Omitindo back_urls/notification_url na preferência MP.')
    return ''
  }
  return trimmed
}

function getWebAppUrl(): string {
  const raw = process.env.WEB_APP_URL?.trim()
  if (!raw) return ''
  const normalized = raw.replace(/\/$/, '')
  return normalized.startsWith('https://') ? normalized : ''
}

function getPublicBaseUrl(): string {
  const raw = process.env.BASE_URL?.trim()
  return raw ? normalizeHttpsBase(raw) : ''
}

const baseUrl = getPublicBaseUrl()

function isTestAccessToken(token: string): boolean {
  if (process.env.MERCADOPAGO_TEST_MODE === 'true') return true
  return token.startsWith('TEST-')
}

const client = accessToken
  ? new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10000 },
    })
  : null

const preferenceClient = client ? new Preference(client) : null

export interface CreatePreferenceParams {
  orderId: string
  totalAmount: number
  items: { title: string; quantity: number; unit_price: number }[]
  payerEmail?: string
}

export async function createPaymentPreference(params: CreatePreferenceParams): Promise<{ initPoint: string; preferenceId: string } | null> {
  if (!preferenceClient || !accessToken) {
    console.warn('MERCADOPAGO_ACCESS_TOKEN não configurado. Pagamento desabilitado.')
    return null
  }
  const { orderId, totalAmount, items, payerEmail } = params
  const testMode = isTestAccessToken(accessToken)

  const includePayerEmail = process.env.MP_INCLUDE_PAYER_EMAIL === 'true'

  const body: Record<string, unknown> = {
    items: items.length > 0
      ? items
      : [{ title: 'Pedido Haras Exemplo', quantity: 1, unit_price: totalAmount }],
    external_reference: orderId,
    statement_descriptor: 'HARASEXEMPLO',
    binary_mode: false,
    locale: 'pt-BR',
    ...(includePayerEmail && payerEmail && { payer: { email: payerEmail } }),
  }

  if (!testMode) {
    body.site_id = 'MLB'
    body.currency_id = 'BRL'
  } else {
    body.currency_id = 'BRL'
  }

  const maxInst = process.env.MP_MAX_INSTALLMENTS?.trim()
  if (maxInst && /^\d+$/.test(maxInst)) {
    const n = Math.min(24, Math.max(1, parseInt(maxInst, 10)))
    body.payment_methods = { installments: n }
  }

  if (baseUrl) {
    const webAppUrl = getWebAppUrl()
    const returnBase = webAppUrl || baseUrl
    body.back_urls = {
      success: `${returnBase}/payment?mp=success&order_id=${encodeURIComponent(orderId)}`,
      failure: `${returnBase}/payment?mp=failure&order_id=${encodeURIComponent(orderId)}`,
      pending: `${returnBase}/payment?mp=pending&order_id=${encodeURIComponent(orderId)}`,
    }
    body.auto_return = 'approved'
    body.notification_url = `${baseUrl}/webhooks/mercadopago`
  } else {
    console.warn(
      '[Mercado Pago] BASE_URL ausente ou inválido: preferência sem webhook/redirect. ' +
        'Configure BASE_URL=https://seu-ngrok... para testar notificações.'
    )
  }
  let preference: unknown
  try {
    preference = await preferenceClient.create({ body: body as unknown as Parameters<Preference['create']>[0]['body'] })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[Mercado Pago] Erro ao criar preferência:', msg)
    if (e && typeof e === 'object' && 'cause' in e) {
      console.error('[Mercado Pago] cause:', (e as { cause?: unknown }).cause)
    }
    try {
      console.error('[Mercado Pago] detalhe:', JSON.stringify(e))
    } catch {}
    throw e
  }
  const res = preference as {
    init_point?: string
    sandbox_init_point?: string
    id?: string
  }
  const initPoint = testMode
    ? (res.sandbox_init_point || res.init_point)
    : (res.init_point || res.sandbox_init_point)
  const preferenceId = res.id
  if (!initPoint) throw new Error('Resposta do Mercado Pago sem init_point / sandbox_init_point')
  return { initPoint, preferenceId: String(preferenceId ?? '') }
}

export async function getPayment(paymentId: string): Promise<{
  status: string
  external_reference: string
  transaction_amount: number
} | null> {
  if (!client) return null

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) return null
  const data = (await response.json()) as {
    status?: string
    external_reference?: string | null
    transaction_amount?: number
  }
  const amount = Number(data.transaction_amount)
  if (!Number.isFinite(amount)) {
    return null
  }
  return {
    status: data.status ?? '',
    external_reference: data.external_reference ?? '',
    transaction_amount: amount,
  }
}

export async function findApprovedPaymentByExternalReference(orderId: string): Promise<{
  id: string
  status: string
  external_reference: string
  transaction_amount: number
} | null> {
  if (!accessToken) return null
  const params = new URLSearchParams({
    external_reference: orderId,
    sort: 'date_created',
    criteria: 'desc',
    limit: '10',
  })
  const response = await fetch(`https://api.mercadopago.com/v1/payments/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) return null
  const data = (await response.json()) as {
    results?: Array<{ id?: number | string; status?: string; external_reference?: string; transaction_amount?: number }>
  }
  const match = data.results?.find((payment) => payment.status === 'approved' && String(payment.external_reference ?? '') === orderId)
  if (!match?.id) return null
  const amount = Number(match.transaction_amount)
  if (!Number.isFinite(amount)) return null
  return {
    id: String(match.id),
    status: match.status ?? '',
    external_reference: match.external_reference ?? '',
    transaction_amount: amount,
  }
}
