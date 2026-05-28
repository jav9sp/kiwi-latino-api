import { Router } from 'express';

const router = Router();

// GET  /api/messages/conversations  → list conversations (auth)
// GET  /api/messages/:userId        → get messages with user (auth)
// POST /api/messages                → send message (auth)
// POST /api/messages/:id/read       → mark as read (auth)

export default router;
