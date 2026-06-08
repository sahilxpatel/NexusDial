import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { intelligenceQueue } from '../../lib/queue';
import { Server } from 'socket.io';

const SimulateCallSchema = z.object({
  virtualNumberId: z.string().cuid(),
  callerMobile: z.string().regex(/^\+[1-9]\d{6,14}$/),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  durationSec: z.number().int().min(0).max(3600),
  hasVoicemail: z.boolean(),
});

export const simulateCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant!.id;
    const body = SimulateCallSchema.parse(req.body);

    const virtualNumber = await prisma.virtualNumber.findFirst({
      where: { id: body.virtualNumberId, tenantId }
    });

    if (!virtualNumber) {
      res.status(404).json({ message: 'Virtual number not found or does not belong to tenant' });
      return;
    }

    let contact = await prisma.contact.findUnique({
      where: { tenantId_phoneNumber: { tenantId, phoneNumber: body.callerMobile } }
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          tenantId,
          phoneNumber: body.callerMobile,
          callCount: 1,
        }
      });
    } else {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: { callCount: { increment: 1 } }
      });
    }

    const status = body.durationSec > 0 ? 'ANSWERED' : 'MISSED';

    const callRecord = await prisma.callRecord.create({
      data: {
        tenantId,
        virtualNumberId: body.virtualNumberId,
        contactId: contact.id,
        direction: body.direction,
        status,
        durationSec: body.durationSec,
      }
    });

    if (body.hasVoicemail) {
      await prisma.intelligenceJob.create({
        data: {
          callRecordId: callRecord.id,
          status: 'PENDING'
        }
      });
      await intelligenceQueue.add('process-voicemail', { 
        callRecordId: callRecord.id, 
        tenantId,
        callerMobile: body.callerMobile
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      });
    }

    const io: Server = req.app.get('io');
    if (io) {
      io.to(tenantId).emit('call_event', callRecord);
    }

    res.json(callRecord);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      logger.error('simulateCall error', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
