import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export const likePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const postId = req.params.id;
  const userId = req.userId!;

  const post = await prisma.post.findFirst({ where: { id: postId, status: 'ACTIVE' } });
  if (!post) {
    sendError(res, 'Publicación no encontrada', 404);
    return;
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    sendError(res, 'Ya le diste like a esta publicación', 409);
    return;
  }

  await prisma.postLike.create({ data: { postId, userId } });
  const likeCount = await prisma.postLike.count({ where: { postId } });
  sendSuccess(res, { likeCount }, 201);
};

export const unlikePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const postId = req.params.id;
  const userId = req.userId!;

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (!existing) {
    sendError(res, 'No le habías dado like a esta publicación', 404);
    return;
  }

  await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
  const likeCount = await prisma.postLike.count({ where: { postId } });
  sendSuccess(res, { likeCount });
};
