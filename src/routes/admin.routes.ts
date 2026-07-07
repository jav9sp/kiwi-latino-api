import { Router } from 'express';
import { getStats, getUsers } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/stats', authenticate, asyncHandler(getStats));
router.get('/users', authenticate, asyncHandler(getUsers));

export default router;
