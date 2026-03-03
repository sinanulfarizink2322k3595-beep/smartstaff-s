import { Router } from 'express';
import {
  createOutpass,
  getOutpasses,
  getOutpassById,
  updateOutpassStatus,
  updateGateStatus
} from '../controllers/outpass.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create outpass request (Student or Security)
router.post('/', authorize('STUDENT', 'SECURITY'), createOutpass);

// Get all outpasses (filtered by role and organization)
router.get('/', getOutpasses);

// Get specific outpass
router.get('/:id', getOutpassById);

// Update outpass status (Staff, Admin)
router.patch('/:id/status', authorize('STAFF', 'ADMIN'), updateOutpassStatus);

// Update gate status (Security)
router.patch('/:id/gate', authorize('SECURITY'), updateGateStatus);

export default router;
