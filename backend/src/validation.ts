import { z } from 'zod'

export const registerBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(256),
})

export const loginBodySchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(256),
})

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email().max(320),
})

export const resetPasswordBodySchema = z.object({
  token: z.string().trim().min(20).max(512),
  password: z.string().min(8).max(256),
})

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(8).max(256),
})

export const patchUserMeBodySchema = z
  .object({
    fullName: z.string().trim().min(1).max(200).optional(),
    phoneNumber: z.union([z.string().max(30), z.literal(''), z.null()]).optional(),
    document: z.union([z.string().max(20), z.literal(''), z.null()]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.document == null || data.document === '') return
    const d = String(data.document).replace(/\D/g, '')
    if (d.length !== 11 && d.length !== 14) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos.',
        path: ['document'],
      })
    }
  })

export const createOrderBodySchema = z.object({
  items: z
    .array(
      z.object({
        itemType: z.enum(['COVERAGE', 'HORSE', 'APPAREL']),
        itemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(999),
      })
    )
    .min(1)
    .max(50),
  shipping: z
    .object({
      deliveryMethod: z.enum(['DELIVERY', 'PICKUP']),
      recipientName: z.string().trim().min(3).max(200),
      recipientPhone: z.string().trim().min(8).max(30),
      recipientDocument: z.string().trim().max(20).optional(),
      freightService: z.string().trim().max(100).optional(),
      estimatedDeliveryDays: z.number().int().min(0).max(120).optional(),
      address: z
        .object({
          zipCode: z.string().trim().min(8).max(12),
          street: z.string().trim().min(2).max(200),
          number: z.string().trim().min(1).max(30),
          complement: z.string().trim().max(120).optional(),
          neighborhood: z.string().trim().min(2).max(120),
          city: z.string().trim().min(2).max(120),
          state: z.string().trim().length(2),
        })
        .optional(),
    })
    .superRefine((shipping, ctx) => {
      if (shipping.deliveryMethod === 'DELIVERY' && !shipping.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Endereço é obrigatório para entrega.',
          path: ['address'],
        })
      }
    })
    .optional(),
  discountCode: z.string().trim().min(1).max(50).optional(),
})

export const coverageProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000).optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().max(2048).optional().nullable(),
  photos: z.array(z.string().url().max(2048)).max(20).optional(),
  isActive: z.boolean().optional(),
})

export const horseProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  breed: z.string().trim().min(1).max(120),
  sire: z.string().trim().min(1).max(200),
  dam: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000).optional(),
  price: z.number().positive(),
  photos: z.array(z.string().url().max(2048)).min(1).max(10),
  isActive: z.boolean().optional(),
})

const apparelProductBaseSchema = z.object({
  type: z.enum(['SHIRT', 'CAP']),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000).optional(),
  imageUrl: z.string().url().max(2048).optional().nullable(),
  photos: z.array(z.string().url().max(2048)).min(1).max(10).optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  sizes: z.array(z.string().trim().max(20)).optional(),
  colors: z.array(z.string().trim().max(40)).optional(),
  isActive: z.boolean().optional(),
})

export const apparelProductSchema = apparelProductBaseSchema.refine(
  (d) => (d.photos && d.photos.length > 0) || !!(d.imageUrl && String(d.imageUrl).trim()),
  {
    message: 'Informe a URL da imagem principal ou ao menos uma foto na galeria.',
    path: ['imageUrl'],
  }
)

export const coverageProductPatchSchema = coverageProductSchema.partial()
export const horseProductPatchSchema = horseProductSchema.partial()
export const apparelProductPatchSchema = apparelProductBaseSchema.partial()

export const discountCodeSchema = z.object({
  code: z.string().trim().min(1).max(50).transform((v) => v.toUpperCase()),
  description: z.string().trim().max(500).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  includeFreight: z.boolean().optional().default(false),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
})

export const discountCodePatchSchema = discountCodeSchema.partial()

export const validateDiscountBodySchema = z.object({
  code: z.string().trim().min(1).max(50).transform((v) => v.toUpperCase()),
  subtotal: z.number().min(0),
  freight: z.number().min(0).default(0),
})

export const newsSchema = z.object({
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().min(1).max(2000),
  body: z.string().trim().min(1).max(500_000),
  imageUrl: z.string().url().max(2048).optional().nullable(),
  order: z.number().int().optional(),
})

export const orderStatusPatchSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED']),
  carrier: z.string().trim().max(100).optional(),
  trackingCode: z.string().trim().max(100).optional(),
})

export const reportsQuerySchema = z.object({
  period: z.enum(['all', 'month', 'year']).default('all'),
})
