import request from 'supertest';
import { app } from '../../src/app';
import { redis } from '../../src/lib/redis';
import { prisma } from '../../src/lib/prisma';
import { httpServer, io } from '../../src/server';

describe('Auth Flow Integration Tests', () => {
  const testMobile = `+9199999${Math.floor(10000 + Math.random() * 90000)}`;
  let receivedOtp: string | null;

  afterAll(async () => {
    await prisma.$disconnect();
    redis.disconnect();
    httpServer.close();
    io.close();
  });

  test('POST /api/auth/send-otp creates OTP in Redis', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ mobile: testMobile });
    
    expect(res.status).toBe(200);

    receivedOtp = await redis.get(`otp:${testMobile}`);
    expect(receivedOtp).not.toBeNull();
    expect(receivedOtp?.length).toBe(6);
  });

  test('POST /api/auth/verify-otp returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ mobile: testMobile, otp: receivedOtp });
    
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    const protectedRes = await request(app)
      .get('/api/numbers')
      .set('Authorization', `Bearer ${res.body.token}`);
    
    expect(protectedRes.status).toBe(200);
  });
});
