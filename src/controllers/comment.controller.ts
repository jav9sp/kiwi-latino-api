import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

const COMMENT_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  userId: true,
  postId: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
} as const;

export const getComments = async (req: Request, res: Response): Promise<void> => {
  const postId = req.params.id;
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
  const skip = (page - 1) * limit;

  const post = await prisma.post.findFirst({ where: { id: postId, status: 'ACTIVE' } });
  if (!post) {
    sendError(res, 'Publicación no encontrada', 404);
    return;
  }

  const [total, items] = await Promise.all([
    prisma.comment.count({ where: { postId } }),
    prisma.comment.findMany({
      where: { postId },
      select: COMMENT_SELECT,
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
  ]);

  sendSuccess(res, { items, total, page, limit, hasMore: skip + items.length < total });
};

export const createComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const postId = req.params.id;
  const { content } = req.body;

  const post = await prisma.post.findFirst({ where: { id: postId, status: 'ACTIVE' } });
  if (!post) {
    sendError(res, 'Publicación no encontrada', 404);
    return;
  }

  const comment = await prisma.comment.create({
    data: { postId, userId: req.userId!, content },
    select: COMMENT_SELECT,
  });

  sendSuccess(res, comment, 201);
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: postId, commentId } = req.params;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.postId !== postId) {
    sendError(res, 'Comentario no encontrado', 404);
    return;
  }
  if (comment.userId !== req.userId) {
    sendError(res, 'No tienes permiso para eliminar este comentario', 403);
    return;
  }

  await prisma.comment.delete({ where: { id: commentId } });
  res.status(204).send();
};
