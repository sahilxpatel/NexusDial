import { Router } from 'express';
import { simulateCall, getCalls } from './calls.controller';

const router = Router();

router.get('/', getCalls);
router.post('/call', simulateCall);

export default router;
