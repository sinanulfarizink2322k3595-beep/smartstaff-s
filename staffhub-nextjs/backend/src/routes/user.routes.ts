import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    getUsersByOrganization,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN'), getUsers);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.get('/organization', authorize('ADMIN', 'STAFF', 'SECURITY'), getUsersByOrganization);
router.get('/:id', authorize('ADMIN'), getUserById);
router.post('/', authorize('ADMIN'), createUser);
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
