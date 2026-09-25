const { PrismaClient } = require('@prisma/client')
const { encryptField, hashForLookup, isEncryptedField } = require('../dist/field-crypto')

async function main() {
  const prisma = new PrismaClient()
  try {
    const users = await prisma.user.findMany({
      select: { id: true, document: true, phoneNumber: true, documentHash: true },
    })
    let updated = 0
    for (const u of users) {
      const data = {}
      if (u.document && !isEncryptedField(u.document)) {
        data.document = encryptField(u.document)
        data.documentHash = hashForLookup(u.document)
      }
      if (u.phoneNumber && !isEncryptedField(u.phoneNumber)) {
        data.phoneNumber = encryptField(u.phoneNumber)
      }
      if (Object.keys(data).length > 0) {
        await prisma.user.update({ where: { id: u.id }, data })
        updated++
      }
    }
    console.log(`[backfill-pii] ${updated}/${users.length} usuário(s) atualizados.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('[backfill-pii] falhou:', e)
  process.exit(1)
})
