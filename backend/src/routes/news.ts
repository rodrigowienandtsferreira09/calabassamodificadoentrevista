import type { FastifyInstance } from 'fastify'
import { adminOnly, parseBody } from '../http'
import { prisma } from '../prisma'
import { sanitizePlainText } from '../sanitize-content'
import { newsSchema } from '../validation'

type IdParams = { Params: { id: string } }

function newsData(body: unknown) {
  const news = parseBody(newsSchema, body)
  return {
    title: sanitizePlainText(news.title, 300),
    summary: sanitizePlainText(news.summary, 2000),
    body: sanitizePlainText(news.body, 500_000),
    imageUrl: news.imageUrl || null,
    order: news.order ?? 0,
  }
}

export async function newsRoutes(app: FastifyInstance) {
  app.get('/news', async () => prisma.news.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] }))

  app.post('/admin/news', adminOnly, async (request, reply) =>
    reply.status(201).send(await prisma.news.create({ data: newsData(request.body) }))
  )

  app.patch<IdParams>('/admin/news/:id', adminOnly, async (request) =>
    prisma.news.update({ where: { id: request.params.id }, data: newsData(request.body) })
  )

  app.delete<IdParams>('/admin/news/:id', adminOnly, async (request) => {
    await prisma.news.delete({ where: { id: request.params.id } })
    return { ok: true }
  })
}
