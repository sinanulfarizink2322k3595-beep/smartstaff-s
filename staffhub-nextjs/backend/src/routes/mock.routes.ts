import { Router } from 'express';
import {
  getMockUsers,
  getMockProfile,
  getMockOutpasses,
  getMockMeetings,
  getMockStats,
  createMockOutpass,
  approveMockOutpass,
} from '../controllers/mock-api.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All mock endpoints require authentication (with mock token support)
router.use(authenticate);

// User endpoints
router.get('/users', getMockUsers);
router.get('/profile', getMockProfile);

// Outpass endpoints
router.get('/outpass', getMockOutpasses);
router.post('/outpass', createMockOutpass);
router.patch('/outpass/:id/approve', approveMockOutpass);

// Meeting endpoints
router.get('/meetings', getMockMeetings);

// Dashboard statistics
router.get('/stats', getMockStats);

export default router;
