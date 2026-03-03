import { Router } from 'express';
import { createFeedback, getFeedback } from '../controllers/feedback.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createFeedback);
router.get('/', authorize('ADMIN'), getFeedback);

export default router;
