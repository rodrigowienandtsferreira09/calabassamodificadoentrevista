import 'dotenv/config'

type SendEmailParams = {
  to: string
  subject: string
  html: string
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim()

  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY/EMAIL_FROM não configurados. E-mail não enviado.')
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!res.ok) {
    const t = await res.text()
    console.error('[email] erro resend:', res.status, t)
    throw new Error('EMAIL_SEND_FAILED')
  }
}

