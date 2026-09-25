import sanitizeHtml from 'sanitize-html'

export function sanitizePlainText(input: string, maxLen = 200_000): string {
  const s = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  })
  return s.length > maxLen ? s.slice(0, maxLen) : s
}

