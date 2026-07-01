import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/image', authenticate, uploadSingle('image'), asyncHandler(uploadImage));

export default router;
