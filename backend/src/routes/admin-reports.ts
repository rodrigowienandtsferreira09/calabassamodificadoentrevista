import type { FastifyInstance } from 'fastify'
import { adminOnly, parseBody } from '../http'
import { prisma } from '../prisma'
import { reportsQuerySchema } from '../validation'

const BILLABLE_STATUSES = ['PAID', 'SHIPPED', 'DELIVERED'] as const

function periodStart(period: 'all' | 'month' | 'year'): Date | null {
  const now = new Date()
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === 'year') return new Date(now.getFullYear(), 0, 1)
  return null
}

async function countProducts(isActive: boolean) {
  const [coverage, horses, apparel] = await Promise.all([
    prisma.coverageProduct.count({ where: { isActive } }),
    prisma.horseProduct.count({ where: { isActive } }),
    prisma.apparelProduct.count({ where: { isActive } }),
  ])
  return { coverage, horses, apparel }
}

export async function adminReportRoutes(app: FastifyInstance) {
  app.get('/admin/reports', adminOnly, async (request) => {
    const { period } = parseBody(reportsQuerySchema, request.query)
    const start = periodStart(period)
    const createdAt = start ? { gte: start } : undefined

    const [ordersByStatus, sales, activeProducts, inactiveProducts] = await Promise.all([
      prisma.order.groupBy({ by: ['status'], where: { createdAt }, _count: true }),
      prisma.order.aggregate({
        where: { createdAt, status: { in: [...BILLABLE_STATUSES] } },
        _sum: { totalAmount: true },
      }),
      countProducts(true),
      countProducts(false),
    ])

    const byStatus = { PENDING: 0, PAID: 0, SHIPPED: 0, DELIVERED: 0, CANCELED: 0, REFUNDED: 0 }
    for (const row of ordersByStatus) byStatus[row.status] = row._count
    const sum = (counts: Record<string, number>) => Object.values(counts).reduce((a, b) => a + b, 0)

    return {
      period,
      totalOrders: sum(byStatus),
      totalSales: Number(sales._sum.totalAmount ?? 0),
      ordersByStatus: byStatus,
      activeProducts,
      inactiveProducts,
      totalProducts: sum(activeProducts) + sum(inactiveProducts),
    }
  })
}
