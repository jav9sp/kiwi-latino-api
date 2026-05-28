import { Router } from 'express';

const router = Router();

// GET    /api/posts          → list with filters
// POST   /api/posts          → create post (auth)
// GET    /api/posts/:id      → get post detail
// PATCH  /api/posts/:id      → update post (auth, owner)
// DELETE /api/posts/:id      → delete post (auth, owner)
// POST   /api/posts/:id/report → report post (auth)

export default router;
