import { Router } from 'express';
import {
  createGateLog,
  getGateLogs,
  createSecurityAlert,
  getSecurityAlerts,
  resolveAlert,
  getDailyLogsSummary,
  getSecurityReports,
  searchStaff
} from '../controllers/security.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GATE LOGS
// Create gate log (Security staff only)
router.post('/gate-logs', authorize('SECURITY'), createGateLog);

// Get gate logs (Security/Admin can see all, Students see their own)
router.get('/gate-logs', getGateLogs);

// SECURITY ALERTS
// Create security alert (Security/Admin)
router.post('/alerts', authorize('ADMIN', 'SECURITY'), createSecurityAlert);

// Get security alerts (Security/Admin only)
router.get('/alerts', authorize('ADMIN', 'SECURITY'), getSecurityAlerts);

// Resolve alert (Security/Admin)
router.patch('/alerts/:alertId/resolve', authorize('ADMIN', 'SECURITY'), resolveAlert);

// DAILY LOGS
// Get daily logs summary (Security/Admin only)
router.get('/daily-logs', authorize('ADMIN', 'SECURITY'), getDailyLogsSummary);

// REPORTS
// Get security reports (Security/Admin only)
router.get('/reports', authorize('ADMIN', 'SECURITY'), getSecurityReports);

// SEARCH
// Search staff (Security/Admin only)
router.get('/search-staff', authorize('ADMIN', 'SECURITY'), searchStaff);

export default router;
