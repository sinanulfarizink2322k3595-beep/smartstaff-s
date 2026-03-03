import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  generateStructure,
  applyStructure,
  undoLastApply,
  getStructure,
  deleteDepartment,
  deleteRole,
  clearStructure,
} from '../controllers/orgbuilder.controller';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// POST /api/orgbuilder/generate - Generate AI structure from prompt
router.post('/generate', generateStructure);

// POST /api/orgbuilder/apply - Apply generated structure to database
router.post('/apply', applyStructure);

// POST /api/orgbuilder/undo - Undo last apply operation
router.post('/undo', undoLastApply);

// GET /api/orgbuilder/structure - Get current organization structure
router.get('/structure', getStructure);

// DELETE /api/orgbuilder/departments/:id - Delete a department
router.delete('/departments/:id', deleteDepartment);

// DELETE /api/orgbuilder/roles/:id - Delete a role
router.delete('/roles/:id', deleteRole);

// DELETE /api/orgbuilder/clear - Clear all structure
router.delete('/clear', clearStructure);

export default router;
