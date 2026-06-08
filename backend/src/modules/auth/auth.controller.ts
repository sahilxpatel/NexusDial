import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { redis } from '../../lib/redis';
import { prisma } from '../../lib/prisma';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { validateE164 } from '../../utils/validators';

const mobileSchema = z.object({
  mobile: z.string().refine(validateE164, 'Invalid E.164 format')
});

const verifySchema = z.object({
  mobile: z.string().refine(validateE164, 'Invalid E.164 format'),
  otp: z.string().length(6)
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile } = mobileSchema.parse(req.body);

    const attemptKey = `otp_attempts:${mobile}`;
    const attempts = await redis.incr(attemptKey);
    if (attempts === 1) {
      await redis.expire(attemptKey, 600);
    }
    if (attempts > 3) {
      res.status(429).json({ message: 'Too many OTP requests. Try again in 10 minutes.' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`otp:${mobile}`, otp, 'EX', 300);

    logger.info({ event: 'OTP_SENT', mobile, otp });

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      logger.error('sendOtp error', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

import { AppError } from '../../middleware/errorHandler';

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mobile, otp } = verifySchema.parse(req.body);

    const storedOtp = await redis.get(`otp:${mobile}`);
    if (!storedOtp) {
      const err = new Error('OTP expired') as AppError;
      err.statusCode = 400;
      err.code = 'ND_4003';
      return next(err);
    }
    
    if (storedOtp !== otp) {
      const err = new Error('Invalid OTP') as AppError;
      err.statusCode = 400;
      err.code = 'ND_4002';
      return next(err);
    }

    await redis.del(`otp:${mobile}`);

    let tenant = await prisma.tenant.findUnique({
      where: { mobile }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          mobile,
          businessName: 'New Business',
        }
      });
    }

    const token = jwt.sign(
      { tenantId: tenant.id, mobile: tenant.mobile },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshTokenString = crypto.randomUUID();
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tenantId: tenant.id,
        token: refreshTokenString,
        expiresAt: refreshTokenExpiresAt
      }
    });

    res.json({ token, refreshToken: refreshTokenString });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      logger.error('verifyOtp error', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { tenant: true }
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const token = jwt.sign(
      { tenantId: tokenRecord.tenantId, mobile: tokenRecord.tenant.mobile },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    
    const newRefreshTokenString = crypto.randomUUID();
    const newRefreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tenantId: tokenRecord.tenantId,
        token: newRefreshTokenString,
        expiresAt: newRefreshTokenExpiresAt
      }
    });

    res.json({ token, refreshToken: newRefreshTokenString });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      logger.error('refresh error', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
