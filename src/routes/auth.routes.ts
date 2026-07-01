import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/refresh', validate(refreshSchema), asyncHandler(refresh));
router.post('/logout', authenticate, asyncHandler(logout));

export default router;
