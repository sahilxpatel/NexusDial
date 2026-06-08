import { Router } from 'express';
import { createNumber, getNumbers, updateNumber, releaseNumber } from './numbers.controller';

const router = Router();

router.post('/', createNumber);
router.get('/', getNumbers);
router.put('/:id', updateNumber);
router.delete('/:id', releaseNumber);

export default router;
