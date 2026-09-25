import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { encryptField, hashForLookup } from '../field-crypto'
import { BadRequestError, authRateLimit, authenticated, parseBody } from '../http'
import { accessTokenExpiresInSeconds, getUserId, resolveAccessToken, signAccessToken } from '../jwt'
import { consumePasswordResetToken, createPasswordResetToken } from '../password-reset-token'
import { prisma } from '../prisma'
import {
  createRefreshTokenForUser,
  findValidRefreshUser,
  refreshTokenTtlMs,
  revokeAllRefreshTokensForUser,
  rotateRefreshToken,
} from '../refresh-tokens'
import { serializeUser } from '../serializers'
import { sendEmail } from '../services/email'
import {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  patchUserMeBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
} from '../validation'

const BCRYPT_ROUNDS = 10
const REFRESH_COOKIE_NAME = 'rt'

const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS)

function refreshCookieOptions(request: FastifyRequest) {
  const secure = request.protocol === 'https'
  return { httpOnly: true, secure, sameSite: secure ? ('none' as const) : ('lax' as const), path: '/auth' }
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', { config: authRateLimit(5, '10 minutes') }, async (request, reply) => {
    const body = parseBody(registerBodySchema, request.body)
    const email = body.email.toLowerCase()
    if (await prisma.user.findUnique({ where: { email } })) throw new BadRequestError('E-mail já cadastrado.')

    const placeholderDocument = `DOC-${Date.now()}`
    await prisma.user.create({
      data: {
        fullName: body.name,
        email,
        passwordHash: await hashPassword(body.password),
        document: encryptField(placeholderDocument)!,
        documentHash: hashForLookup(placeholderDocument),
      },
    })
    return reply.status(201).send({ message: 'Conta criada com sucesso!' })
  })

  app.post('/login', { config: authRateLimit(8, '1 minute') }, async (request, reply) => {
    const body = parseBody(loginBodySchema, request.body)
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw new BadRequestError('E-mail ou senha incorretos.')
    }
    const refreshToken = await createRefreshTokenForUser(user.id)
    reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...refreshCookieOptions(request),
      maxAge: Math.floor(refreshTokenTtlMs() / 1000),
    })
    return reply.send({
      message: 'Login realizado!',
      user: serializeUser(user),
      token: signAccessToken(user.id, user.role, user.sessionVersion),
      expiresIn: accessTokenExpiresInSeconds(),
    })
  })

  app.post('/auth/refresh', { config: authRateLimit(30, '1 minute') }, async (request, reply) => {
    const rawToken = request.cookies?.[REFRESH_COOKIE_NAME]
    const found = rawToken ? await findValidRefreshUser(rawToken) : null
    const user = found ? await prisma.user.findUnique({ where: { id: found.userId } }) : null
    if (!found || !user) return reply.status(401).send({ error: 'Refresh inválido ou expirado.' })

    const newRefresh = await rotateRefreshToken(found.id, user.id)
    reply.setCookie(REFRESH_COOKIE_NAME, newRefresh, {
      ...refreshCookieOptions(request),
      maxAge: Math.floor(refreshTokenTtlMs() / 1000),
    })
    return reply.send({
      token: signAccessToken(user.id, user.role, user.sessionVersion),
      expiresIn: accessTokenExpiresInSeconds(),
    })
  })

  app.post('/auth/logout', async (request, reply) => {
    reply.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions(request))
    const session = await resolveAccessToken(request.headers.authorization)
    if (session) {
      await revokeAllRefreshTokensForUser(session.sub)
      await prisma.user.update({ where: { id: session.sub }, data: { sessionVersion: { increment: 1 } } })
      return reply.send({ ok: true })
    }
    const cookieToken = request.cookies?.[REFRESH_COOKIE_NAME]
    const found = cookieToken ? await findValidRefreshUser(cookieToken) : null
    if (found) await revokeAllRefreshTokensForUser(found.userId)
    return reply.send({ ok: true })
  })

  app.post('/auth/forgot-password', { config: authRateLimit(3, '10 minutes') }, async (request, reply) => {
    const body = parseBody(forgotPasswordBodySchema, request.body)
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
    const webAppUrl = process.env.WEB_APP_URL?.trim().replace(/\/$/, '')

    if (user?.isActive && webAppUrl) {
      const token = await createPasswordResetToken(user.id)
      const resetUrl = `${webAppUrl}/auth/reset-password?token=${encodeURIComponent(token)}`
      await sendEmail({
        to: user.email,
        subject: 'Redefinição de senha',
        html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${resetUrl}">Definir nova senha</a></p><p>Este link expira em breve e só pode ser usado uma vez.</p>`,
      }).catch((error) => console.error('[password-reset] falha ao enviar e-mail:', error))
    }

    return reply.send({ message: 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.' })
  })

  app.post('/auth/reset-password', { config: authRateLimit(8, '10 minutes') }, async (request, reply) => {
    const body = parseBody(resetPasswordBodySchema, request.body)
    const consumed = await consumePasswordResetToken(body.token)
    if (!consumed) throw new BadRequestError('Link inválido ou expirado.')

    await prisma.user.update({
      where: { id: consumed.userId },
      data: { passwordHash: await hashPassword(body.password), sessionVersion: { increment: 1 } },
    })
    await revokeAllRefreshTokensForUser(consumed.userId)
    return reply.send({ message: 'Senha alterada com sucesso.' })
  })

  app.post('/auth/change-password', authenticated, async (request, reply) => {
    const body = parseBody(changePasswordBodySchema, request.body)
    const userId = getUserId(request)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (!(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
      throw new BadRequestError('Senha atual incorreta.')
    }
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(body.newPassword), sessionVersion: { increment: 1 } },
    })
    await revokeAllRefreshTokensForUser(userId)
    return reply.send({ message: 'Senha alterada.' })
  })

  app.get('/users/me', authenticated, async (request, reply) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: getUserId(request) } })
    return reply.send(serializeUser(user))
  })

  app.patch('/users/me', authenticated, async (request, reply) => {
    const body = parseBody(patchUserMeBodySchema, request.body)
    const documentDigits = body.document?.replace(/\D/g, '')
    try {
      const user = await prisma.user.update({
        where: { id: getUserId(request) },
        data: {
          fullName: body.fullName,
          ...(body.phoneNumber !== undefined && { phoneNumber: encryptField(body.phoneNumber || null) }),
          ...(documentDigits && { document: encryptField(documentDigits)!, documentHash: hashForLookup(documentDigits) }),
        },
      })
      return reply.send(serializeUser(user))
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestError('Este CPF/CNPJ já está cadastrado em outra conta.')
      }
      throw e
    }
  })
}
