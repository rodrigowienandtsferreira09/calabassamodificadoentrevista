const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

function getLocalMigrationNames() {
  const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations')
  if (!fs.existsSync(migrationsDir)) return []
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort()
}

function run(cmd) {
  console.log('[migrate]', cmd)
  execSync(cmd, { stdio: 'inherit', env: process.env })
}

function runCapture(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe', encoding: 'utf8', env: process.env })
    return { ok: true, out: '' }
  } catch (e) {
    const out = [e.stderr, e.stdout, e.message].map((x) => String(x || '')).join('\n')
    return { ok: false, out }
  }
}

function isP3005(output) {
  return (
    output.includes('P3005') ||
    output.toLowerCase().includes('database schema is not empty') ||
    output.toLowerCase().includes('baseline')
  )
}

function isP1001(output) {
  return output.includes('P1001') || output.toLowerCase().includes("can't reach database server")
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function deployWithRetry(maxAttempts = 5, waitMs = 4000) {
  let last = { ok: false, out: '' }
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = runCapture('npx prisma migrate deploy')
    if (last.ok) return last
    if (!isP1001(last.out) || attempt === maxAttempts) return last
    console.warn(`[migrate] P1001 (tentativa ${attempt}/${maxAttempts}). Aguardando ${waitMs}ms...`)
    sleep(waitMs)
  }
  return last
}

function applyEnsureSchema() {
  const root = path.join(__dirname, '..')
  const schemaPath = path.join(root, 'prisma', 'schema.prisma')
  const sqlPath = path.join(root, 'prisma', 'ensure-schema.sql')
  if (!fs.existsSync(sqlPath)) {
    console.warn('[migrate] ensure-schema.sql não encontrado, pulando.')
    return
  }
  const cmd = `npx prisma db execute --file "${sqlPath}" --schema "${schemaPath}"`
  const r = runCapture(cmd)
  if (!r.ok) {
    console.warn('[migrate] ensure-schema.sql falhou:', r.out.slice(0, 800))
    return
  }
  console.log('[migrate] ensure-schema.sql aplicado com sucesso.')
}

function main() {
  const first = deployWithRetry()
  if (first.ok) {
    applyEnsureSchema()
    return
  }

  if (!isP3005(first.out)) {
    console.error(first.out)
    process.exit(1)
  }

  const local = getLocalMigrationNames()
  console.warn(
    `[migrate] P3005 detectado: schema já existente sem histórico Prisma. ` +
      `Pulando migrate deploy para manter o serviço no ar. ` +
      `Migrações locais detectadas: ${local.join(', ') || '(nenhuma)'}`
  )
  applyEnsureSchema()
}

main()
