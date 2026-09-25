import type { FastifyInstance } from 'fastify'
import { decryptField } from '../field-crypto'
import { verifyMercadoPagoWebhookSignature } from '../mercadopago-webhook-verify'
import { prisma } from '../prisma'
import { getPayment } from '../services/mercadopago'

export async function publicRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true, service: 'haras-exemplo-api' }))

  app.get('/contacts', async () => {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true, fullName: true, email: true, phoneNumber: true },
    })
    return {
      platformPhone: process.env.PLATFORM_PHONE?.trim() || null,
      admins: admins.map((a) => ({ id: a.id, name: a.fullName, email: a.email, phone: decryptField(a.phoneNumber) })),
    }
  })

  app.post('/webhooks/mercadopago', async (request, reply) => {
    const body = (request.body ?? {}) as { data?: { id?: unknown } }
    const query = request.query as Record<string, string | undefined>
    const rawId = body.data?.id ?? query['data.id'] ?? query.id
    const paymentId = rawId != null ? String(rawId) : null

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()
    if (!secret && process.env.NODE_ENV === 'production') {
      console.error('[mercadopago-webhook] MERCADOPAGO_WEBHOOK_SECRET ausente em produção')
      return reply.status(401).send({ error: 'Webhook não configurado.' })
    }
    if (secret) {
      const valid = verifyMercadoPagoWebhookSignature({
        secret,
        xSignature: request.headers['x-signature'] as string | undefined,
        xRequestId: request.headers['x-request-id'] as string | undefined,
        dataId: paymentId,
      })
      if (!valid) return reply.status(401).send({ error: 'Assinatura inválida' })
    }

    const payment = paymentId ? await getPayment(paymentId) : null
    if (payment?.status === 'approved' && payment.external_reference) {
      const result = await prisma.order.updateMany({
        where: { id: payment.external_reference, status: 'PENDING' },
        data: { status: 'PAID', mercadoPagoPaymentId: paymentId, paidAt: new Date() },
      })
      console.info('[mercadopago-webhook] pedido atualizado', { paymentId, orderId: payment.external_reference, updated: result.count })
    }
    return reply.send({ ok: true })
  })
}
