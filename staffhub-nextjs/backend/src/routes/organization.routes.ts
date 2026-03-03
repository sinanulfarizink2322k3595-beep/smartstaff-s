import { Router } from 'express';
import { getOrganization, updateOrganization } from '../controllers/organization.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/:id', getOrganization);
router.patch('/:id', authorize('ADMIN'), updateOrganization);

export default router;
