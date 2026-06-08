import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  for (let i = 0; i < 20; i++) {
    // Generate a random 8 digit number
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000)
    const e164Number = `+9198${randomDigits}`

    await prisma.numberPool.upsert({
      where: { e164Number },
      update: {},
      create: {
        e164Number,
        isAssigned: false,
      },
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
