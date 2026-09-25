import cookie = require('@fastify/cookie')
import cors from '@fastify/cors'
import helmet = require('@fastify/helmet')
import multipart = require('@fastify/multipart')
import rateLimit = require('@fastify/rate-limit')
import 'dotenv/config'
import fastify from 'fastify'
import { errorHandler } from './http'
import { adminReportRoutes } from './routes/admin-reports'
import { authRoutes } from './routes/auth'
import { discountRoutes } from './routes/discounts'
import { newsRoutes } from './routes/news'
import { orderRoutes } from './routes/orders'
import { productRoutes } from './routes/products'
import { publicRoutes } from './routes/public'
import { uploadRoutes } from './routes/uploads'
import { attachSentryToFastify, initBackendSentry } from './sentry-init'

initBackendSentry()

const isProduction = process.env.NODE_ENV === 'production'
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
const configuredOrigins = (process.env.CORS_ORIGINS ?? process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
const allowedOrigins = new Set(configuredOrigins.length || isProduction ? configuredOrigins : DEV_ORIGINS)

const app = fastify({ trustProxy: true })

app.register(cors, {
  origin: (origin, cb) =>
    !origin || allowedOrigins.has(origin) ? cb(null, true) : cb(new Error('Origin não permitida por CORS'), false),
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
})
app.register(helmet)
app.register(cookie)
app.register(rateLimit, { global: false })
app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } })

app.setErrorHandler(errorHandler)
attachSentryToFastify(app)

app.register(publicRoutes)
app.register(authRoutes)
app.register(productRoutes)
app.register(uploadRoutes)
app.register(discountRoutes)
app.register(orderRoutes)
app.register(newsRoutes)
app.register(adminReportRoutes)

const port = Number(process.env.PORT || 3333)
app.listen({ port, host: process.env.LISTEN_HOST || '0.0.0.0' }).then(() => {
  console.log(`Server running on ${port}`)
})
