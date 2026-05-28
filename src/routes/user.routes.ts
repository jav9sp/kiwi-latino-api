import { Router } from 'express';

const router = Router();

// GET   /api/users/me        → get own profile (auth)
// PATCH /api/users/me        → update profile (auth)
// GET   /api/users/:id       → get public profile

export default router;
