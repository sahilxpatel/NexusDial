import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis';
import { Request } from 'express';

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => (redis as any).call(...args),
  }),
  keyGenerator: (req: Request) => (req.body.mobile || req.ip || '') as string,
  message: { message: 'Too many auth requests, please try again later.' }
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => (redis as any).call(...args),
  }),
  keyGenerator: (req: Request) => (req.tenant?.id || req.ip || '') as string,
  message: { message: 'Too many requests, please try again later.' }
});
