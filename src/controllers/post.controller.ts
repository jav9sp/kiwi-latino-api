import { Response } from 'express';
import { PostModule, PostStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

const POST_SELECT = {
  id: true,
  module: true,
  title: true,
  description: true,
  city: true,
  price: true,
  currency: true,
  images: true,
  status: true,
  contactInfo: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  user: {
    select: { id: true, name: true, avatarUrl: true },
  },
} as const;

export const getPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    module,
    city,
    minPrice,
    maxPrice,
    tipoAlojamiento,
    disponibleDesde,
    tipoTrabajo,
    categoria,
    condicion,
  } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { status: 'ACTIVE' as PostStatus };

  if (module) where.module = module as PostModule;
  if (city) where.city = city;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  // Housing-specific metadata filters (PostgreSQL JSON path queries)
  const metaConditions: object[] = [];
  if (tipoAlojamiento) {
    metaConditions.push({ metadata: { path: ['tipo'], equals: tipoAlojamiento } });
  }
  if (disponibleDesde) {
    metaConditions.push({ metadata: { path: ['disponibleDesde'], gte: disponibleDesde } });
  }
  if (tipoTrabajo) {
    metaConditions.push({ metadata: { path: ['tipo'], equals: tipoTrabajo } });
  }
  if (categoria) {
    metaConditions.push({ metadata: { path: ['categoria'], equals: categoria } });
  }
  if (condicion) {
    metaConditions.push({ metadata: { path: ['condicion'], equals: condicion } });
  }
  if (metaConditions.length > 0) {
    where.AND = metaConditions;
  }

  const [total, items] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      select: POST_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  sendSuccess(res, {
    items,
    total,
    page,
    limit,
    hasMore: skip + items.length < total,
  });
};

export const createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { module, title, description, city, price, currency, images, contactInfo, metadata } = req.body;

  const post = await prisma.post.create({
    data: {
      userId: req.userId!,
      module,
      title,
      description,
      city,
      ...(price !== undefined && { price }),
      currency: currency ?? 'NZD',
      images: images ?? [],
      ...(contactInfo !== undefined && { contactInfo }),
      ...(metadata !== undefined && { metadata }),
    },
    select: POST_SELECT,
  });

  sendSuccess(res, post, 201);
};

export const getPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const post = await prisma.post.findFirst({
    where: { id: req.params.id, status: 'ACTIVE' },
    select: POST_SELECT,
  });

  if (!post) {
    sendError(res, 'Publicación no encontrada', 404);
    return;
  }

  sendSuccess(res, post);
};

export const updatePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });

  if (!existing || existing.status === 'DELETED') {
    sendError(res, 'Publicación no encontrada', 404);
    return;
  }
  if (existing.userId !== req.userId) {
    sendError(res, 'No tienes permiso para editar esta publicación', 403);
    return;
  }

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: req.body,
    select: POST_SELECT,
  });

  sendSuccess(res, updated);
};

export const deletePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });

  if (!existing || existing.status === 'DELETED') {
    sendError(res, 'Publicación no encontrada', 404);
    return;
  }
  if (existing.userId !== req.userId) {
    sendError(res, 'No tienes permiso para eliminar esta publicación', 403);
    return;
  }

  await prisma.post.update({ where: { id: req.params.id }, data: { status: 'DELETED' } });
  res.status(204).send();
};

export const reportPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { reason, details } = req.body;
  const postId = req.params.id;

  const post = await prisma.post.findFirst({ where: { id: postId, status: 'ACTIVE' } });
  if (!post) {
    sendError(res, 'Publicación no encontrada', 404);
    return;
  }

  const existing = await prisma.report.findFirst({
    where: { postId, reporterId: req.userId! },
  });
  if (existing) {
    sendError(res, 'Ya reportaste esta publicación', 409);
    return;
  }

  const report = await prisma.report.create({
    data: {
      postId,
      reporterId: req.userId!,
      reason,
      ...(details && { details }),
    },
    select: { id: true, reason: true, createdAt: true },
  });

  sendSuccess(res, report, 201);
};
