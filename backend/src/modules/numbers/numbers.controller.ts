import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

// POST /api/numbers
export const createNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant!.id;
    const { label } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const poolNumber = await tx.numberPool.findFirst({
        where: { isAssigned: false },
        orderBy: { createdAt: 'asc' }
      });

      if (!poolNumber) {
        throw new Error('No available numbers in pool');
      }

      await tx.numberPool.update({
        where: { id: poolNumber.id },
        data: { isAssigned: true, assignedAt: new Date() }
      });

      const virtualNumber = await tx.virtualNumber.create({
        data: {
          tenantId,
          e164Number: poolNumber.e164Number,
          label: label || ''
        }
      });

      return virtualNumber;
    });

    const count = await prisma.numberPool.count({
      where: { isAssigned: false }
    });

    if (count < 5) {
      logger.warn({
        event: 'NUMBER_POOL_LOW',
        remaining: count,
        message: 'ALERT: Virtual number pool critically low — provision more DIDs',
      });
    }

    res.json(result);
  } catch (error: any) {
    logger.error('createNumber error', error);
    if (error.message === 'No available numbers in pool') {
      res.status(400).json({ message: 'No available numbers in the pool. Please contact support.' });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

// GET /api/numbers
export const getNumbers = async (req: Request, res: Response): Promise<void> => {
  try {
    // ALWAYS looks like this — tenantId first, always
    const numbers = await prisma.virtualNumber.findMany({
      where: { tenantId: req.tenant!.id },
    });
    res.json(numbers);
  } catch (error) {
    logger.error('getNumbers error', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// PUT /api/numbers/:id
export const updateNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant!.id;
    const { id } = req.params;
    const { label, isActive } = req.body;

    const existing = await prisma.virtualNumber.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      res.status(404).json({ message: 'Virtual number not found' });
      return;
    }

    const updated = await prisma.virtualNumber.update({
      where: { id },
      data: {
        label: label !== undefined ? label : existing.label,
        isActive: isActive !== undefined ? isActive : existing.isActive
      }
    });

    res.json(updated);
  } catch (error) {
    logger.error('updateNumber error', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// DELETE /api/numbers/:id
export const releaseNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant!.id;
    const { id } = req.params;

    const existing = await prisma.virtualNumber.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      res.status(404).json({ message: 'Virtual number not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.numberPool.update({
        where: { e164Number: existing.e164Number },
        data: { isAssigned: false, assignedAt: null }
      });

      await tx.virtualNumber.delete({
        where: { id }
      });
    });

    res.json({ message: 'Number released successfully' });
  } catch (error) {
    logger.error('releaseNumber error', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
