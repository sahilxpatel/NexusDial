import { Router } from 'express';
import { simulateCall } from './calls.controller';

const router = Router();

router.post('/call', simulateCall);

export default router;
