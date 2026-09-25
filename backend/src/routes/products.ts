import type { FastifyInstance } from 'fastify'
import { adminOnly, emptyToNull, parseBody } from '../http'
import { prisma } from '../prisma'
import { withNumericPrice } from '../serializers'
import {
  apparelProductPatchSchema,
  apparelProductSchema,
  coverageProductPatchSchema,
  coverageProductSchema,
  horseProductPatchSchema,
  horseProductSchema,
} from '../validation'

type IdParams = { Params: { id: string } }

async function listProducts(onlyActive: boolean) {
  const where = onlyActive ? { isActive: true } : {}
  const orderBy = { createdAt: 'desc' as const }
  const [coverage, horses, apparel] = await Promise.all([
    prisma.coverageProduct.findMany({ where, orderBy }),
    prisma.horseProduct.findMany({ where, orderBy }),
    prisma.apparelProduct.findMany({ where, orderBy }),
  ])
  return {
    coverage: coverage.map(withNumericPrice),
    horses: horses.map(withNumericPrice),
    apparel: apparel.map(withNumericPrice),
  }
}

export async function productRoutes(app: FastifyInstance) {
  app.get('/products', async () => listProducts(true))
  app.get('/admin/products', adminOnly, async () => listProducts(false))

  app.post('/admin/products/coverage', adminOnly, async (request, reply) => {
    const body = parseBody(coverageProductSchema, request.body)
    const photos = body.photos ?? (body.imageUrl ? [body.imageUrl] : [])
    const product = await prisma.coverageProduct.create({ data: { ...body, imageUrl: body.imageUrl || null, photos } })
    return reply.status(201).send(withNumericPrice(product))
  })

  app.patch<IdParams>('/admin/products/coverage/:id', adminOnly, async (request) => {
    const body = parseBody(coverageProductPatchSchema, request.body)
    const product = await prisma.coverageProduct.update({
      where: { id: request.params.id },
      data: { ...body, description: emptyToNull(body.description), imageUrl: emptyToNull(body.imageUrl) },
    })
    return withNumericPrice(product)
  })

  app.delete<IdParams>('/admin/products/coverage/:id', adminOnly, async (request) =>
    withNumericPrice(await prisma.coverageProduct.update({ where: { id: request.params.id }, data: { isActive: false } }))
  )

  app.post('/admin/products/horses', adminOnly, async (request, reply) => {
    const product = await prisma.horseProduct.create({ data: parseBody(horseProductSchema, request.body) })
    return reply.status(201).send(withNumericPrice(product))
  })

  app.patch<IdParams>('/admin/products/horses/:id', adminOnly, async (request) => {
    const body = parseBody(horseProductPatchSchema, request.body)
    const product = await prisma.horseProduct.update({
      where: { id: request.params.id },
      data: { ...body, description: emptyToNull(body.description) },
    })
    return withNumericPrice(product)
  })

  app.delete<IdParams>('/admin/products/horses/:id', adminOnly, async (request) =>
    withNumericPrice(await prisma.horseProduct.update({ where: { id: request.params.id }, data: { isActive: false } }))
  )

  app.post('/admin/products/apparel', adminOnly, async (request, reply) => {
    const body = parseBody(apparelProductSchema, request.body)
    const photos = body.photos ?? []
    const product = await prisma.apparelProduct.create({
      data: { ...body, imageUrl: body.imageUrl || photos[0] || null, photos, sizes: body.sizes ?? [], colors: body.colors ?? [] },
    })
    return reply.status(201).send(withNumericPrice(product))
  })

  app.patch<IdParams>('/admin/products/apparel/:id', adminOnly, async (request) => {
    const body = parseBody(apparelProductPatchSchema, request.body)
    const imageUrl = body.imageUrl !== undefined ? emptyToNull(body.imageUrl) : body.photos ? (body.photos[0] ?? null) : undefined
    const product = await prisma.apparelProduct.update({
      where: { id: request.params.id },
      data: { ...body, description: emptyToNull(body.description), imageUrl },
    })
    return withNumericPrice(product)
  })

  app.delete<IdParams>('/admin/products/apparel/:id', adminOnly, async (request) =>
    withNumericPrice(await prisma.apparelProduct.update({ where: { id: request.params.id }, data: { isActive: false } }))
  )
}
