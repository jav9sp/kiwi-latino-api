import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import { POST_BASE_SELECT, formatPost } from './post.controller';

export const savePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const postId = req.params.id;
  const userId = req.userId!;

  const post = await prisma.post.findFirst({ where: { id: postId, status: 'ACTIVE' } });
  if (!post) {
    sendError(res, 'Publicación no encontrada', 404);
    return;
  }

  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    sendError(res, 'Ya guardaste esta publicación', 409);
    return;
  }

  await prisma.savedPost.create({ data: { postId, userId } });
  sendSuccess(res, null, 201);
};

export const unsavePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const postId = req.params.id;
  const userId = req.userId!;

  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (!existing) {
    sendError(res, 'No habías guardado esta publicación', 404);
    return;
  }

  await prisma.savedPost.delete({ where: { postId_userId: { postId, userId } } });
  res.status(204).send();
};

export const getSavedPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '12', 10)));
  const skip = (page - 1) * limit;

  const [total, saved] = await Promise.all([
    prisma.savedPost.count({ where: { userId } }),
    prisma.savedPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        post: {
          select: {
            ...POST_BASE_SELECT,
            likes: { where: { userId }, select: { id: true }, take: 1 },
            saves: { where: { userId }, select: { id: true }, take: 1 },
          },
        },
      },
    }),
  ]);

  const items = saved.map((s) => formatPost(s.post, userId));
  sendSuccess(res, { items, total, page, limit, hasMore: skip + items.length < total });
};
