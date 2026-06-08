import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config/env';
import { AppError } from './errorHandler';

export const validateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Unauthorized') as AppError;
      err.statusCode = 401;
      err.code = 'ND_4001';
      return next(err);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { tenantId: string; mobile: string };

    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId }
    });

    if (!tenant) {
      const err = new Error('Unauthorized') as AppError;
      err.statusCode = 401;
      err.code = 'ND_4001';
      return next(err);
    }

    (req as any).tenant = tenant;
    next();
  } catch (error) {
    const err = new Error('Unauthorized') as AppError;
    err.statusCode = 401;
    err.code = 'ND_4001';
    next(err);
  }
};
