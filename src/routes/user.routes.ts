import { Router } from 'express';
import { getMe, updateMe, changePassword, getUserById } from '../controllers/user.controller';
import { getSavedPosts } from '../controllers/save.controller';
import { savePushToken } from '../controllers/push.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema } from '../schemas/user.schema';
import { changePasswordSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/me', authenticate, asyncHandler(getMe));
router.get('/me/saved-posts', authenticate, asyncHandler(getSavedPosts));
router.patch('/me', authenticate, validate(updateProfileSchema), asyncHandler(updateMe));
router.patch('/me/password', authenticate, validate(changePasswordSchema), asyncHandler(changePassword));
router.post('/push-token', authenticate, asyncHandler(savePushToken));
router.get('/:id', authenticate, asyncHandler(getUserById));

export default router;
