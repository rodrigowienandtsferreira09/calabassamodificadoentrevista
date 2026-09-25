import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { randomUUID } from 'node:crypto'
import { adminOnly } from '../http'
import { r2ConfigOk, uploadToR2 } from '../services/storage'
import { detectMediaMagic, validateImageDimensions } from '../upload-image'

async function handleMediaUpload(request: FastifyRequest, reply: FastifyReply, folder: string) {
  if (!r2ConfigOk()) {
    return reply.status(503).send({
      error: 'Armazenamento não configurado. Defina R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL e R2_BUCKET.',
    })
  }

  const part = await request.file().catch(() => undefined)
  if (!part) return reply.status(400).send({ error: 'Envie um arquivo no campo "file".' })

  const buf = await part.toBuffer()
  const detected = detectMediaMagic(buf)
  if (!detected) return reply.status(400).send({ error: 'Use JPEG, PNG, WebP, GIF ou MP4.' })
  if (detected.mime.startsWith('image/')) {
    const dim = validateImageDimensions(buf)
    if (!dim.ok) return reply.status(400).send({ error: dim.error })
  }

  try {
    const url = await uploadToR2(buf, `${folder}/${randomUUID()}.${detected.ext}`, detected.mime)
    return reply.send({ url })
  } catch {
    return reply.status(503).send({ error: 'Falha ao enviar imagem para o armazenamento.' })
  }
}

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/admin/upload/image', adminOnly, (request, reply) => handleMediaUpload(request, reply, 'products'))
  app.post('/admin/news/upload', adminOnly, (request, reply) => handleMediaUpload(request, reply, 'news'))
}
