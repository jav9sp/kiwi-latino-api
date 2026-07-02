import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createPostSchema,
  updatePostSchema,
  listPostsSchema,
  reportPostSchema,
} from '../schemas/post.schema';
import { createCommentSchema, listCommentsSchema } from '../schemas/comment.schema';
import {
  getPosts,
  createPost,
  getPost,
  updatePost,
  deletePost,
  reportPost,
} from '../controllers/post.controller';
import { likePost, unlikePost } from '../controllers/like.controller';
import { savePost, unsavePost } from '../controllers/save.controller';
import { getComments, createComment, deleteComment } from '../controllers/comment.controller';

const router = Router();

router.get('/', optionalAuthenticate, validate(listPostsSchema), asyncHandler(getPosts));
router.post('/', authenticate, validate(createPostSchema), asyncHandler(createPost));
router.get('/:id', optionalAuthenticate, asyncHandler(getPost));
router.patch('/:id', authenticate, validate(updatePostSchema), asyncHandler(updatePost));
router.delete('/:id', authenticate, asyncHandler(deletePost));
router.post('/:id/report', authenticate, validate(reportPostSchema), asyncHandler(reportPost));

// Likes
router.post('/:id/like', authenticate, asyncHandler(likePost));
router.delete('/:id/like', authenticate, asyncHandler(unlikePost));

// Saves
router.post('/:id/save', authenticate, asyncHandler(savePost));
router.delete('/:id/save', authenticate, asyncHandler(unsavePost));

// Comments
router.get('/:id/comments', validate(listCommentsSchema), asyncHandler(getComments));
router.post('/:id/comments', authenticate, validate(createCommentSchema), asyncHandler(createComment));
router.delete('/:id/comments/:commentId', authenticate, asyncHandler(deleteComment));

export default router;
