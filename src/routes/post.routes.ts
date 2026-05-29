import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createPostSchema,
  updatePostSchema,
  listPostsSchema,
  reportPostSchema,
} from '../schemas/post.schema';
import {
  getPosts,
  createPost,
  getPost,
  updatePost,
  deletePost,
  reportPost,
} from '../controllers/post.controller';

const router = Router();

// GET    /api/posts        → list (public, filterable, paginated)
// POST   /api/posts        → create (auth)
// GET    /api/posts/:id    → detail (public, only ACTIVE)
// PATCH  /api/posts/:id    → update (auth, owner only)
// DELETE /api/posts/:id    → soft delete (auth, owner only)
// POST   /api/posts/:id/report → report (auth, unique per user)

router.get('/', validate(listPostsSchema), asyncHandler(getPosts));
router.post('/', authenticate, validate(createPostSchema), asyncHandler(createPost));
router.get('/:id', asyncHandler(getPost));
router.patch('/:id', authenticate, validate(updatePostSchema), asyncHandler(updatePost));
router.delete('/:id', authenticate, asyncHandler(deletePost));
router.post('/:id/report', authenticate, validate(reportPostSchema), asyncHandler(reportPost));

export default router;
