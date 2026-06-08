import { Worker } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { extractWithAI, ExtractedData } from '../services/ai.service';
import { io } from '../server';

const TRANSCRIPTS = [
  "Haan bhai, main Ramesh bol raha hoon. Aapka call back chahiye, urgent matter hai property ke baare mein.",
  "This is Priya from accounts. Please call me back regarding the invoice number 4521. Thank you.",
  "Namaste, mujhe aapki service ke baare mein jaankari chahiye. Please call karo.",
  "Hello, no one is answering. This is very frustrating, I have a complaint about my recent order.",
  "Hi there, just calling to confirm our meeting tomorrow at 10 AM. Thanks, John.",
  "Main aapki bank se bol rahi hoon, aapka credit card block ho gaya hai.",
  "This is regarding the job application. I wanted to follow up.",
  "Aapka delivery person aya tha lekin parcel nahi mila. Mujhe callback dijiye, main Rakesh bol raha hu.",
  "Hi, I want to cancel my subscription immediately. It is too expensive.",
  "Mujhe naya phone lena hai, aapke store me iPhone available hai kya?"
];

const pickRandomTranscript = () => {
  return TRANSCRIPTS[Math.floor(Math.random() * TRANSCRIPTS.length)];
};

export const intelligenceWorker = new Worker('intelligence', async (job) => {
  const { callRecordId, tenantId, callerMobile } = job.data;
  const start = Date.now();
  
  await prisma.intelligenceJob.update({
    where: { callRecordId },
    data: { status: 'PROCESSING' },
  });
  
  const transcript = pickRandomTranscript();
  
  let extractedData: ExtractedData | null = null;
  try {
    extractedData = await extractWithAI(transcript);
  } catch (err) {
    logger.error({ event: 'AI_EXTRACTION_FAILED', callRecordId, error: err });
  }
  
  if (callerMobile) {
    const existingContact = await prisma.contact.findUnique({
      where: { tenantId_phoneNumber: { tenantId, phoneNumber: callerMobile } }
    });

    let newTags: string[] = [];
    if (existingContact && existingContact.tags) {
      newTags = [...existingContact.tags];
    }

    if (extractedData?.intent && !newTags.includes(extractedData.intent)) {
      newTags.push(extractedData.intent);
    }

    await prisma.contact.upsert({
      where: { tenantId_phoneNumber: { tenantId, phoneNumber: callerMobile } },
      create: { 
        tenantId, 
        phoneNumber: callerMobile, 
        name: extractedData?.name || null, 
        callCount: 1,
        tags: extractedData?.intent ? [extractedData.intent] : [] 
      },
      update: {
        callCount: { increment: 1 },
        name: extractedData?.name ? extractedData.name : undefined, 
        tags: newTags
      },
    });
  }
  
  await prisma.intelligenceJob.update({
    where: { callRecordId },
    data: {
      status: extractedData ? 'DONE' : 'FAILED',
      transcript,
      extractedData: extractedData ? (extractedData as any) : undefined,
      processingMs: Date.now() - start,
    },
  });
  
  let enrichedCallRecord = await prisma.callRecord.findUnique({
    where: { id: callRecordId },
    include: { intelligenceJob: true }
  });

  if (extractedData && enrichedCallRecord) {
    enrichedCallRecord = await prisma.callRecord.update({
      where: { id: callRecordId },
      data: { aiSummary: `${extractedData.intent ?? 'No intent'} — ${extractedData.sentiment}` },
      include: { intelligenceJob: true }
    });
  }
  
  if (io && enrichedCallRecord) {
    io.to(tenantId).emit('intelligence_ready', enrichedCallRecord);
  }
  
}, {
  connection: redis,
  concurrency: 3,
});

intelligenceWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with error:`, err);
});
