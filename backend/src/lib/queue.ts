import { Queue } from 'bullmq';
import { redis } from './redis';

export const intelligenceQueue = new Queue('intelligence', {
  connection: redis as any,
});
