import sizeOf from 'image-size';

const MAX_SIDE = Number(process.env.UPLOAD_IMAGE_MAX_SIDE || '8000')

export type DetectedImage = { mime: string; ext: 'jpg' | 'png' | 'webp' | 'gif' }

export type DetectedMedia = DetectedImage | { mime: 'video/mp4'; ext: 'mp4' }

export function detectImageMagic(buf: Buffer): DetectedImage | null {
  if (!buf || buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' }
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' }
  }
  const head = buf.subarray(0, 6).toString('ascii')
  if (head === 'GIF87a' || head === 'GIF89a') {
    return { mime: 'image/gif', ext: 'gif' }
  }
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp' }
  }
  return null
}

export function detectMediaMagic(buf: Buffer): DetectedMedia | null {
  const image = detectImageMagic(buf)
  if (image) return image
  if (buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    return { mime: 'video/mp4', ext: 'mp4' }
  }
  return null
}

export function validateImageDimensions(buf: Buffer): { ok: true; width: number; height: number } | { ok: false; error: string } {
  try {
    const dim = sizeOf(buf)
    const w = dim.width ?? 0
    const h = dim.height ?? 0
    if (w < 1 || h < 1) return { ok: false, error: 'Não foi possível ler dimensões da imagem.' }
    if (w > MAX_SIDE || h > MAX_SIDE) {
      return { ok: false, error: `Imagem muito grande (máximo ${MAX_SIDE}px por lado).` }
    }
    return { ok: true, width: w, height: h }
  } catch {
    return { ok: false, error: 'Arquivo de imagem inválido ou corrompido.' }
  }
}
