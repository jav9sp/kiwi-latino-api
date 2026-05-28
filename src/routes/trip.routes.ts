import { Router } from 'express';

const router = Router();

// GET    /api/trips           → list trips with filters
// POST   /api/trips           → create trip (auth)
// GET    /api/trips/:id       → trip detail
// POST   /api/trips/:id/book  → book seat (auth)
// DELETE /api/trips/:id/book  → cancel booking (auth)

export default router;
