import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/env';
import { intelligenceQueue } from '../../src/lib/queue';
import { httpServer, io } from '../../src/server';

describe('Simulate Call Integration Tests', () => {
  let tenantId: string;
  let virtualNumberId: string;
  let token: string;

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: {
        businessName: 'Test Business',
        mobile: `+1000000${Date.now()}`.slice(0, 15)
      }
    });
    tenantId = tenant.id;

    token = jwt.sign({ tenantId, mobile: tenant.mobile }, config.jwtSecret, { expiresIn: '1h' });

    const vn = await prisma.virtualNumber.create({
      data: {
        tenantId,
        e164Number: `+1999000${Math.floor(Math.random() * 1000)}`,
        label: 'Test Number'
      }
    });
    virtualNumberId = vn.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    httpServer.close();
    io.close();
  });

  test('POST /api/simulate/call creates record and enqueues job', async () => {
    const res = await request(app)
      .post('/api/simulate/call')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        virtualNumberId, 
        callerMobile: '+919876543210', 
        direction: 'INBOUND', 
        durationSec: 45, 
        hasVoicemail: true 
      });
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ANSWERED');
    
    const jobs = await intelligenceQueue.getJobs(['waiting', 'active', 'delayed', 'completed']);
    const job = jobs.find(j => j.data.callRecordId === res.body.id);
    expect(job).not.toBeUndefined();
  });
});
