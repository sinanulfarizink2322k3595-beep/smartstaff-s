import { Router } from 'express';
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeetingStatus
} from '../controllers/meeting.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('STUDENT'), createMeeting);
router.get('/', getMeetings);
router.get('/:id', getMeetingById);
router.patch('/:id/status', authorize('STAFF', 'ADMIN'), updateMeetingStatus);

export default router;
