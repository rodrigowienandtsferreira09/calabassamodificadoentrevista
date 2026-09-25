import type { Prisma } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { z } from 'zod'
import { BadRequestError, adminOnly, authenticated, parseBody } from '../http'
import { getUserId } from '../jwt'
import { prisma } from '../prisma'
import { ADMIN_ORDER_INCLUDE, ORDER_INCLUDE, serializeOrder } from '../serializers'
import { evaluateDiscount } from '../services/discounts'
import { createPaymentPreference, findApprovedPaymentByExternalReference } from '../services/mercadopago'
import { createOrderBodySchema, orderStatusPatchSchema } from '../validation'

type IdParams = { Params: { id: string } }
type OrderLine = z.output<typeof createOrderBodySchema>['items'][number]

const FIXED_SHIPPING_AMOUNT = 15
const ITEM_TITLE = { COVERAGE: 'Cobertura', HORSE: 'Cavalo', APPAREL: 'Vestuário' } as const

const itemUnavailable = () => new BadRequestError('Um ou mais itens do pedido não estão mais disponíveis.')

async function priceLine(
  tx: Prisma.TransactionClient,
  line: OrderLine
): Promise<Prisma.OrderItemUncheckedCreateWithoutOrderInput> {
  const where = { id: line.itemId, isActive: true }
  if (line.itemType === 'COVERAGE') {
    const p = await tx.coverageProduct.findFirst({ where })
    if (!p) throw itemUnavailable()
    return { itemType: 'COVERAGE', coverageProductId: p.id, quantity: line.quantity, unitPrice: p.price }
  }
  if (line.itemType === 'HORSE') {
    const p = await tx.horseProduct.findFirst({ where })
    if (!p) throw itemUnavailable()
    return { itemType: 'HORSE', horseProductId: p.id, quantity: 1, unitPrice: p.price }
  }
  const p = await tx.apparelProduct.findFirst({ where })
  if (!p) throw itemUnavailable()
  if (p.stock < line.quantity) throw new BadRequestError('Estoque insuficiente para um dos itens do pedido.')
  await tx.apparelProduct.update({ where: { id: p.id }, data: { stock: { decrement: line.quantity } } })
  return { itemType: 'APPAREL', apparelProductId: p.id, quantity: line.quantity, unitPrice: p.price }
}

function findBuyerOrder(id: string, buyerId: string) {
  return prisma.order.findFirst({ where: { id, buyerId }, include: ORDER_INCLUDE })
}

export async function orderRoutes(app: FastifyInstance) {
  app.post('/orders', authenticated, async (request, reply) => {
    const body = parseBody(createOrderBodySchema, request.body)
    const buyerId = getUserId(request)
    const shipping = body.shipping
    const deliveryMethod = shipping?.deliveryMethod ?? 'PICKUP'
    const shippingAmount = deliveryMethod === 'DELIVERY' ? FIXED_SHIPPING_AMOUNT : 0

    const order = await prisma.$transaction(async (tx) => {
      const items: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = []
      for (const line of body.items) items.push(await priceLine(tx, line))
      const subtotal = items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0)

      const discountCode = body.discountCode?.toUpperCase()
      const applied = discountCode
        ? await evaluateDiscount(tx, { code: discountCode, userId: buyerId, subtotal, freight: shippingAmount })
        : null

      const created = await tx.order.create({
        data: {
          buyerId,
          status: 'PENDING',
          totalAmount: Math.max(0, subtotal + shippingAmount - (applied?.amount ?? 0)),
          items: { create: items },
          deliveryMethod,
          recipientName: shipping?.recipientName ?? 'Não informado',
          recipientPhone: shipping?.recipientPhone ?? 'Não informado',
          recipientDocument: shipping?.recipientDocument || null,
          deliveryZipCode: shipping?.address?.zipCode ?? null,
          deliveryStreet: shipping?.address?.street ?? null,
          deliveryNumber: shipping?.address?.number ?? null,
          deliveryComplement: shipping?.address?.complement || null,
          deliveryNeighborhood: shipping?.address?.neighborhood ?? null,
          deliveryCity: shipping?.address?.city ?? null,
          deliveryState: shipping?.address?.state ?? null,
          shippingService: shipping?.freightService || (deliveryMethod === 'DELIVERY' ? 'Frete fixo' : 'Retirada'),
          shippingAmount,
          shippingEstimatedDays: shipping?.estimatedDeliveryDays ?? null,
          ...(applied && { discountCodeId: applied.discount.id, discountAmount: applied.amount }),
        },
        include: { items: true, buyer: { select: { email: true } } },
      })

      if (applied) {
        await tx.discountCode.update({ where: { id: applied.discount.id }, data: { usedCount: { increment: 1 } } })
        await tx.discountUsage.create({ data: { discountCodeId: applied.discount.id, orderId: created.id, userId: buyerId } })
      }
      return created
    })

    const paymentItems = order.discountAmount
      ? [{ title: 'Pedido Haras Exemplo', quantity: 1, unit_price: Number(order.totalAmount) }]
      : [
          ...order.items.map((i) => ({ title: ITEM_TITLE[i.itemType], quantity: i.quantity, unit_price: Number(i.unitPrice) })),
          ...(shippingAmount > 0
            ? [{ title: `Frete ${order.shippingService ?? ''}`.trim(), quantity: 1, unit_price: shippingAmount }]
            : []),
        ]

    const preference = await createPaymentPreference({
      orderId: order.id,
      totalAmount: Number(order.totalAmount),
      items: paymentItems,
      payerEmail: order.buyer.email,
    }).catch((e: unknown) => {
      console.error('[orders] Falha ao criar preferência MP:', e instanceof Error ? e.message : e)
      return null
    })

    const orderJson = { ...order, totalAmount: Number(order.totalAmount) }
    if (!preference) return reply.status(201).send(orderJson)

    await prisma.order.update({ where: { id: order.id }, data: { mercadoPagoPreferenceId: preference.preferenceId } })
    return reply.status(201).send({ order: orderJson, initPoint: preference.initPoint })
  })

  app.get('/buyer/orders', authenticated, async (request) => {
    const orders = await prisma.order.findMany({
      where: { buyerId: getUserId(request) },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    return orders.map(serializeOrder)
  })

  app.get<IdParams>('/buyer/orders/:id', authenticated, async (request, reply) => {
    const buyerId = getUserId(request)
    let order = await findBuyerOrder(request.params.id, buyerId)
    if (!order) return reply.status(404).send({ error: 'Pedido não encontrado.' })

    if (order.status === 'PENDING') {
      const payment = await findApprovedPaymentByExternalReference(order.id).catch(() => null)
      if (payment) {
        await prisma.order.updateMany({
          where: { id: order.id, status: 'PENDING' },
          data: { status: 'PAID', mercadoPagoPaymentId: payment.id, paidAt: new Date() },
        })
        order = (await findBuyerOrder(order.id, buyerId))!
      }
    }
    return serializeOrder(order)
  })

  app.get('/admin/orders', adminOnly, async () => {
    const orders = await prisma.order.findMany({ include: ADMIN_ORDER_INCLUDE, orderBy: { createdAt: 'desc' } })
    return orders.map(serializeOrder)
  })

  app.patch<IdParams>('/admin/orders/:id/status', adminOnly, async (request) => {
    const { status, carrier, trackingCode } = parseBody(orderStatusPatchSchema, request.body)
    const existing = await prisma.order.findUniqueOrThrow({ where: { id: request.params.id } })
    const now = new Date()
    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status,
        ...(carrier !== undefined && { carrier: carrier || null }),
        ...(trackingCode !== undefined && { trackingCode: trackingCode || null }),
        ...(status === 'PAID' && !existing.paidAt && { paidAt: now }),
        ...(status === 'SHIPPED' && !existing.shippedAt && { shippedAt: now }),
        ...(status === 'DELIVERED' && !existing.deliveredAt && { deliveredAt: now }),
      },
      include: ADMIN_ORDER_INCLUDE,
    })
    return serializeOrder(updated)
  })
}
