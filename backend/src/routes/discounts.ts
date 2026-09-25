import type { FastifyInstance } from 'fastify'
import { BadRequestError, adminOnly, authenticated, emptyToNull, parseBody } from '../http'
import { getUserId } from '../jwt'
import { prisma } from '../prisma'
import { serializeDiscount } from '../serializers'
import { evaluateDiscount } from '../services/discounts'
import { discountCodePatchSchema, discountCodeSchema, validateDiscountBodySchema } from '../validation'

type IdParams = { Params: { id: string } }

function toDate(value: string | null | undefined): Date | null | undefined {
  return value === undefined ? undefined : value ? new Date(value) : null
}

async function assertCodeAvailable(code: string, exceptId?: string) {
  const duplicate = await prisma.discountCode.findFirst({ where: { code, ...(exceptId && { id: { not: exceptId } }) } })
  if (duplicate) throw new BadRequestError('Já existe um cupom com esse código.')
}

export async function discountRoutes(app: FastifyInstance) {
  app.get('/admin/discounts', adminOnly, async () => {
    const discounts = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } })
    return discounts.map(serializeDiscount)
  })

  app.post('/admin/discounts', adminOnly, async (request, reply) => {
    const body = parseBody(discountCodeSchema, request.body)
    await assertCodeAvailable(body.code)
    const discount = await prisma.discountCode.create({
      data: {
        ...body,
        description: body.description || null,
        startsAt: toDate(body.startsAt),
        expiresAt: toDate(body.expiresAt),
      },
    })
    return reply.status(201).send(serializeDiscount(discount))
  })

  app.patch<IdParams>('/admin/discounts/:id', adminOnly, async (request) => {
    const body = parseBody(discountCodePatchSchema, request.body)
    if (body.code !== undefined) await assertCodeAvailable(body.code, request.params.id)
    const discount = await prisma.discountCode.update({
      where: { id: request.params.id },
      data: {
        ...body,
        description: emptyToNull(body.description),
        startsAt: toDate(body.startsAt),
        expiresAt: toDate(body.expiresAt),
      },
    })
    return serializeDiscount(discount)
  })

  app.delete<IdParams>('/admin/discounts/:id', adminOnly, async (request) =>
    serializeDiscount(await prisma.discountCode.update({ where: { id: request.params.id }, data: { isActive: false } }))
  )

  app.post('/discounts/validate', authenticated, async (request) => {
    const body = parseBody(validateDiscountBodySchema, request.body)
    const { discount, amount } = await evaluateDiscount(prisma, {
      code: body.code,
      userId: getUserId(request),
      subtotal: body.subtotal,
      freight: body.freight,
    })
    return {
      valid: true,
      code: discount.code,
      type: discount.type,
      value: Number(discount.value),
      discountAmount: amount,
      includeFreight: discount.includeFreight,
      description: discount.description,
    }
  })
}
