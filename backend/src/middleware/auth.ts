import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config/env';

export const validateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ code: 'ND_4001', message: 'Unauthorized' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { tenantId: string; mobile: string };

    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId }
    });

    if (!tenant) {
      res.status(401).json({ code: 'ND_4001', message: 'Unauthorized' });
      return;
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(401).json({ code: 'ND_4001', message: 'Unauthorized' });
  }
};
