import { ApparelProductType, PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { encryptField, hashForLookup } from '../src/field-crypto'

const prisma = new PrismaClient()

const PLACEHOLDER_PHOTO = 'https://placehold.co/800x600/18181b/a1a1aa?text=Cavalo'

function seedUser(email: string, fullName: string, document: string, role: UserRole, passwordHash: string) {
  return prisma.user.upsert({
    where: { email },
    create: {
      fullName,
      email,
      passwordHash,
      document: encryptField(document)!,
      documentHash: hashForLookup(document),
      role,
    },
    update: {},
  })
}

async function main() {
  const password = process.env.SEED_PASSWORD || randomBytes(9).toString('base64url')
  const passwordHash = await bcrypt.hash(password, 10)

  const admin = await seedUser('admin@exemplo.com', 'Administrador', '00000000000', UserRole.ADMIN, passwordHash)
  const buyer = await seedUser('comprador@exemplo.com', 'Comprador Teste', '11111111111', UserRole.BUYER, passwordHash)

  if ((await prisma.coverageProduct.count()) === 0) {
    await prisma.coverageProduct.createMany({
      data: [
        {
          name: 'Cobertura Elite Imperial',
          description: 'Cobertura com genética de ponta e suporte técnico.',
          price: 3500,
          isActive: true,
        },
        {
          name: 'Cobertura Campeão Nacional',
          description: 'Cobertura de garanhão premiado em provas nacionais.',
          price: 5200,
          isActive: true,
        },
      ],
    })
  }

  if ((await prisma.horseProduct.count()) === 0) {
    await prisma.horseProduct.createMany({
      data: [
        {
          name: 'Trovão do Sul',
          breed: 'Crioulo',
          sire: 'Soberano do Sul',
          dam: 'Aurora da Serra',
          description: 'Animal funcional, premiado e pronto para reprodução e pista.',
          photos: [PLACEHOLDER_PHOTO],
          price: 120000,
          isActive: true,
        },
        {
          name: 'Rei do Campo',
          breed: 'Quarto de Milha',
          sire: 'Dash Legacy',
          dam: 'Miss Thunder',
          description: 'Potencial atlético elevado e excelente morfologia.',
          photos: [PLACEHOLDER_PHOTO],
          price: 98000,
          isActive: true,
        },
      ],
    })
  }

  if ((await prisma.apparelProduct.count()) === 0) {
    await prisma.apparelProduct.createMany({
      data: [
        {
          type: ApparelProductType.SHIRT,
          name: 'Camiseta Haras Exemplo',
          description: 'Camiseta oficial em algodão premium.',
          price: 119.9,
          stock: 100,
          sizes: ['P', 'M', 'G', 'GG'],
          colors: ['Preto', 'Branco'],
          isActive: true,
        },
        {
          type: ApparelProductType.CAP,
          name: 'Boné Oficial Haras Exemplo',
          description: 'Boné com bordado frontal da marca.',
          price: 89.9,
          stock: 80,
          sizes: ['U'],
          colors: ['Preto', 'Marrom'],
          isActive: true,
        },
      ],
    })
  }

  if ((await prisma.news.count()) === 0) {
    await prisma.news.createMany({
      data: [
        {
          title: 'Nova fase do Haras Exemplo',
          summary: 'Agora com catálogo completo de cobertura, cavalos e produtos oficiais.',
          body: 'A Haras Exemplo inicia uma nova fase com vendas centralizadas e atendimento direto do administrador.',
          order: 0,
        },
        {
          title: 'Temporada de cobertura aberta',
          summary: 'Condições especiais para reservas antecipadas.',
          body: 'A nova temporada de cobertura está disponível com lotes limitados e acompanhamento técnico especializado.',
          order: 1,
        },
      ],
    })
  }

  console.log('Seed concluído com sucesso.')
  console.log(`Usuários de teste (senha: ${password}): ${admin.email}, ${buyer.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
