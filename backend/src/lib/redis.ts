import Redis from 'ioredis';
import { config } from '../config/env';

const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });

export { redis };
