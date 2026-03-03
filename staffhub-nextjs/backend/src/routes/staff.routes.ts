import { Router } from 'express';
import { getStaffMembers, getStaffAvailability } from '../controllers/staff.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getStaffMembers);
router.get('/:id/availability', getStaffAvailability);

export default router;
