const fs = require('node:fs')
const path = require('node:path')

const entry = path.join(__dirname, '..', 'dist', 'server.js')
if (!fs.existsSync(entry)) {
  console.error(
    '[start] ERRO: não encontrado',
    entry,
    '— rode `npm run build` no deploy ou verifique o Root Directory (backend).'
  )
  process.exit(1)
}

require(entry)
