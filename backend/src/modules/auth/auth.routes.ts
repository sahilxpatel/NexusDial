import { Router } from 'express';
import { sendOtp, verifyOtp, refresh } from './auth.controller';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/refresh', refresh);

export default router;
