import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export const getContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { tenantId: req.tenant.id, isDeleted: false },
      orderBy: { firstSeenAt: 'desc' }
    });
    res.json(contacts);
  } catch (error) {
    logger.error('getContacts error', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getContactById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId: req.tenant.id, isDeleted: false }
    });
    if (!contact) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }
    res.json(contact);
  } catch (error) {
    logger.error('getContactById error', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getContactTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // Ensure contact belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId: req.tenant.id }
    });

    if (!contact) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    const calls = await prisma.callRecord.findMany({
      where: { tenantId: req.tenant.id, contactId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        virtualNumber: { select: { label: true, e164Number: true } },
        intelligenceJob: true
      }
    });
    
    res.json(calls);
  } catch (error) {
    logger.error('getContactTimeline error', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, tags } = req.body;

    const existing = await prisma.contact.findFirst({
      where: { id, tenantId: req.tenant.id, isDeleted: false }
    });

    if (!existing) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        tags: tags !== undefined ? tags : existing.tags
      }
    });

    res.json(updated);
  } catch (error) {
    logger.error('updateContact error', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.contact.findFirst({
      where: { id, tenantId: req.tenant.id, isDeleted: false }
    });

    if (!existing) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    await prisma.contact.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    logger.error('deleteContact error', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
