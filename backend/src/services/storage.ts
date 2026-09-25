import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import 'dotenv/config'

function r2ConfigOk(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_PUBLIC_URL?.trim() &&
      process.env.R2_BUCKET?.trim()
  )
}

const r2Client = r2ConfigOk()
  ? new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null

const R2_BUCKET = process.env.R2_BUCKET?.trim()

export async function uploadToR2(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  if (!r2Client) {
    console.error('[R2] Defina R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL no .env')
    throw new Error('R2_NOT_CONFIGURED')
  }
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType || 'application/octet-stream',
    })

    await r2Client.send(command)

    const base = String(process.env.R2_PUBLIC_URL).replace(/\/$/, '')
    return `${base}/${fileName}`
  } catch (error) {
    console.error('Erro no upload R2:', error)
    throw new Error('R2_UPLOAD_FAILED')
  }
}

export { r2ConfigOk }
