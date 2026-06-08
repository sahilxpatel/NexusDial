import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export const getSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    // Calculate boundaries for "Today" and "This Week"
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Simple start of week (Sunday as start)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - dayOfWeek);

    const totalCallsToday = await prisma.callRecord.count({
      where: {
        tenantId: req.tenant.id,
        createdAt: { gte: startOfDay }
      }
    });

    const missedCallsToday = await prisma.callRecord.count({
      where: {
        tenantId: req.tenant.id,
        status: 'MISSED',
        createdAt: { gte: startOfDay }
      }
    });

    const newContactsThisWeek = await prisma.contact.count({
      where: {
        tenantId: req.tenant.id,
        firstSeenAt: { gte: startOfWeek }
      }
    });

    const topCallers = await prisma.contact.findMany({
      where: { tenantId: req.tenant.id },
      orderBy: { callCount: 'desc' },
      take: 5
    });

    // Sentiment breakdown processing
    // We fetch all intelligence jobs for the tenant's calls
    const intelligenceJobs = await prisma.intelligenceJob.findMany({
      where: {
        callRecord: { tenantId: req.tenant.id },
        status: 'DONE'
      },
      select: { extractedData: true }
    });

    let positive = 0;
    let neutral = 0;
    let negative = 0;

    for (const job of intelligenceJobs) {
      if (job.extractedData && typeof job.extractedData === 'object') {
        const data = job.extractedData as any;
        if (data.sentiment === 'positive') positive++;
        else if (data.sentiment === 'negative') negative++;
        else if (data.sentiment === 'neutral') neutral++;
      }
    }

    res.json({
      totalCallsToday,
      missedCallsToday,
      newContactsThisWeek,
      topCallers,
      sentimentBreakdown: { positive, neutral, negative }
    });
  } catch (error) {
    logger.error('getSummary error', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
