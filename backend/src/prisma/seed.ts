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

  // ── NEW: Demo Tenant ──────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { mobile: '+919800000001' },
    update: {},
    create: {
      businessName: 'Demo Business',
      mobile: '+919800000001',
      planTier: 'PRO',
    },
  });

  // ── NEW: Provision a virtual number for demo tenant ───────────
  const poolNumber = await prisma.numberPool.findFirst({
    where: { isAssigned: false },
  });

  let virtualNumber;
  if (poolNumber) {
    await prisma.numberPool.update({
      where: { id: poolNumber.id },
      data: { isAssigned: true, assignedAt: new Date() },
    });
    virtualNumber = await prisma.virtualNumber.upsert({
      where: { e164Number: poolNumber.e164Number },
      update: {},
      create: {
        tenantId: tenant.id,
        e164Number: poolNumber.e164Number,
        label: 'Main Business Line',
        isActive: true,
      },
    });
  }

  // ── NEW: Demo Contacts ────────────────────────────────────────
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: '+919876543210' } },
      update: {},
      create: {
        tenantId: tenant.id,
        phoneNumber: '+919876543210',
        name: 'Ramesh Sharma',
        tags: ['property inquiry', 'callback requested'],
        callCount: 4,
      },
    }),
    prisma.contact.upsert({
      where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: '+919845001122' } },
      update: {},
      create: {
        tenantId: tenant.id,
        phoneNumber: '+919845001122',
        name: 'Priya Mehta',
        tags: ['invoice query', 'accounts'],
        callCount: 2,
      },
    }),
    prisma.contact.upsert({
      where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: '+919712345678' } },
      update: {},
      create: {
        tenantId: tenant.id,
        phoneNumber: '+919712345678',
        name: null,   // unknown caller
        tags: ['support'],
        callCount: 1,
      },
    }),
  ]);

  // ── NEW: Demo Call Records ────────────────────────────────────
  if (virtualNumber) {
    const calls = await Promise.all([
      prisma.callRecord.create({
        data: {
          tenantId: tenant.id,
          virtualNumberId: virtualNumber.id,
          contactId: contacts[0].id,
          direction: 'INBOUND',
          status: 'ANSWERED',
          durationSec: 142,
          aiSummary: 'Property inquiry — wants callback about 2BHK listing',
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        },
      }),
      prisma.callRecord.create({
        data: {
          tenantId: tenant.id,
          virtualNumberId: virtualNumber.id,
          contactId: contacts[0].id,
          direction: 'INBOUND',
          status: 'MISSED',
          durationSec: 0,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hrs ago
        },
      }),
      prisma.callRecord.create({
        data: {
          tenantId: tenant.id,
          virtualNumberId: virtualNumber.id,
          contactId: contacts[1].id,
          direction: 'INBOUND',
          status: 'ANSWERED',
          durationSec: 67,
          aiSummary: 'Invoice dispute — neutral sentiment, no callback requested',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hrs ago
        },
      }),
      prisma.callRecord.create({
        data: {
          tenantId: tenant.id,
          virtualNumberId: virtualNumber.id,
          contactId: contacts[2].id,
          direction: 'INBOUND',
          status: 'MISSED',
          durationSec: 0,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // yesterday
        },
      }),
    ]);

    // ── NEW: Intelligence jobs for answered calls with voicemail ──
    await Promise.all([
      prisma.intelligenceJob.create({
        data: {
          callRecordId: calls[0].id,
          status: 'DONE',
          transcript: 'Haan bhai, main Ramesh bol raha hoon. Mujhe 2BHK ke baare mein baat karni thi. Please call back karo, urgent hai.',
          extractedData: {
            name: 'Ramesh',
            intent: 'Inquiry about 2BHK property listing',
            sentiment: 'positive',
            callbackRequested: true,
          },
          processingMs: 1840,
        },
      }),
      prisma.intelligenceJob.create({
        data: {
          callRecordId: calls[2].id,
          status: 'DONE',
          transcript: 'This is Priya from accounts. Calling regarding invoice 4521, there seems to be a discrepancy. Please review and get back to me.',
          extractedData: {
            name: 'Priya',
            intent: 'Invoice discrepancy on invoice number 4521',
            sentiment: 'neutral',
            callbackRequested: false,
          },
          processingMs: 1120,
        },
      }),
    ]);
  }

  console.log('✅ Seed complete — demo tenant mobile: +919800000001');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
