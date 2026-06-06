import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendMessageSchema, getMessagesSchema } from '../schemas/message.schema';
import { getConversations, getMessages, sendMessage } from '../controllers/message.controller';

const router = Router();

// Todas las rutas de mensajes requieren autenticación
router.use(authenticate);

router.get('/conversations', asyncHandler(getConversations));
router.get('/:userId', validate(getMessagesSchema), asyncHandler(getMessages));
router.post('/', validate(sendMessageSchema), asyncHandler(sendMessage));

export default router;
