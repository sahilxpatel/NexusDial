import { Router } from 'express';
import { getContacts, getContactById, getContactTimeline, updateContact, deleteContact } from './contacts.controller';

const router = Router();

router.get('/', getContacts);
router.get('/:id', getContactById);
router.get('/:id/timeline', getContactTimeline);
router.patch('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
