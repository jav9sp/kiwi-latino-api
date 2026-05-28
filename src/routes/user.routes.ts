import { Router } from 'express';
import { getMe, updateMe, getUserById } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema } from '../schemas/user.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/me', authenticate, asyncHandler(getMe));
router.patch('/me', authenticate, validate(updateProfileSchema), asyncHandler(updateMe));
router.get('/:id', authenticate, asyncHandler(getUserById));

export default router;
