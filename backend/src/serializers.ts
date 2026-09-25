import type { DiscountCode, Prisma, User } from '@prisma/client'
import { decryptField } from './field-crypto'

export function withNumericPrice<T extends { price: Prisma.Decimal }>(product: T) {
  return { ...product, price: Number(product.price) }
}

export function serializeDiscount(discount: DiscountCode) {
  return {
    ...discount,
    value: Number(discount.value),
    minOrderAmount: discount.minOrderAmount != null ? Number(discount.minOrderAmount) : null,
  }
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    document: decryptField(user.document),
    phoneNumber: decryptField(user.phoneNumber),
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }
}

export const ORDER_INCLUDE = {
  items: {
    include: {
      coverageProduct: { select: { id: true, name: true, imageUrl: true } },
      horseProduct: { select: { id: true, name: true, photos: true } },
      apparelProduct: { select: { id: true, name: true, imageUrl: true, photos: true } },
    },
  },
} satisfies Prisma.OrderInclude

export const ADMIN_ORDER_INCLUDE = {
  ...ORDER_INCLUDE,
  buyer: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
} satisfies Prisma.OrderInclude

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }> & {
  buyer?: { phoneNumber: string | null }
}

const ITEM_FALLBACK_NAME = { COVERAGE: 'Cobertura', HORSE: 'Cavalo', APPAREL: 'Vestuário' } as const

function serializeOrderItem(item: OrderWithItems['items'][number]) {
  const product = item.coverageProduct ?? item.horseProduct ?? item.apparelProduct
  const imageUrl =
    item.horseProduct?.photos[0] ??
    item.apparelProduct?.imageUrl ??
    item.apparelProduct?.photos[0] ??
    item.coverageProduct?.imageUrl ??
    null
  return {
    id: item.id,
    itemType: item.itemType,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    product: { id: product?.id ?? null, name: product?.name ?? ITEM_FALLBACK_NAME[item.itemType], imageUrl },
  }
}

export function serializeOrder(order: OrderWithItems) {
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    shippingAmount: Number(order.shippingAmount),
    items: order.items.map(serializeOrderItem),
    ...(order.buyer ? { buyer: { ...order.buyer, phoneNumber: decryptField(order.buyer.phoneNumber) } } : {}),
  }
}
