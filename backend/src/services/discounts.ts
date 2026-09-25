import type { DiscountCode, Prisma } from '@prisma/client'
import { BadRequestError } from '../http'

export async function evaluateDiscount(
  db: Prisma.TransactionClient,
  params: { code: string; userId: string; subtotal: number; freight: number }
): Promise<{ discount: DiscountCode; amount: number }> {
  const discount = await db.discountCode.findUnique({ where: { code: params.code } })
  if (!discount || !discount.isActive) throw new BadRequestError('Cupom inválido ou inativo.')

  const now = new Date()
  if (discount.startsAt && now < discount.startsAt) throw new BadRequestError('Este cupom ainda não está ativo.')
  if (discount.expiresAt && now > discount.expiresAt) throw new BadRequestError('Este cupom já expirou.')
  if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
    throw new BadRequestError('Este cupom atingiu o limite de usos.')
  }

  const alreadyUsed = await db.discountUsage.findUnique({
    where: { discountCodeId_userId: { discountCodeId: discount.id, userId: params.userId } },
  })
  if (alreadyUsed) throw new BadRequestError('Você já utilizou este cupom.')

  const base = params.subtotal + (discount.includeFreight ? params.freight : 0)
  if (discount.minOrderAmount != null && base < Number(discount.minOrderAmount)) {
    const min = Number(discount.minOrderAmount).toFixed(2).replace('.', ',')
    throw new BadRequestError(`Valor mínimo do pedido: R$ ${min}.`)
  }

  const value = Number(discount.value)
  const amount = discount.type === 'PERCENTAGE' ? Math.round(base * value) / 100 : Math.min(value, base)
  return { discount, amount }
}
