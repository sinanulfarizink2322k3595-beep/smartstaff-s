import { Router } from 'express';
import { register, signup, login, verifyToken, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify', authenticate, verifyToken);
router.get('/me', authenticate, getCurrentUser);

export default router;
