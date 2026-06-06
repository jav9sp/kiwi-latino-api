import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

const USER_SELECT = { id: true, name: true, avatarUrl: true } as const;

const MESSAGE_SELECT = {
  id: true,
  senderId: true,
  receiverId: true,
  postId: true,
  content: true,
  readAt: true,
  createdAt: true,
} as const;

export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  // Encuentra todos los interlocutores únicos (usuarios con quienes hay mensajes)
  const [sentTo, receivedFrom] = await Promise.all([
    prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    }),
    prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    }),
  ]);

  const partnerIds = [
    ...new Set([
      ...sentTo.map((m) => m.receiverId),
      ...receivedFrom.map((m) => m.senderId),
    ]),
  ];

  if (partnerIds.length === 0) {
    sendSuccess(res, []);
    return;
  }

  // Para cada interlocutor: último mensaje + no leídos + datos de usuario
  const conversations = await Promise.all(
    partnerIds.map(async (partnerId) => {
      const [lastMessage, unreadCount, partner] = await Promise.all([
        prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: partnerId },
              { senderId: partnerId, receiverId: userId },
            ],
          },
          select: MESSAGE_SELECT,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.message.count({
          where: { senderId: partnerId, receiverId: userId, readAt: null },
        }),
        prisma.user.findUnique({
          where: { id: partnerId },
          select: USER_SELECT,
        }),
      ]);

      return { user: partner, lastMessage, unreadCount };
    }),
  );

  // Ordena por mensaje más reciente primero
  conversations.sort(
    (a, b) =>
      new Date(b.lastMessage!.createdAt).getTime() -
      new Date(a.lastMessage!.createdAt).getTime(),
  );

  sendSuccess(res, conversations);
};

export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const otherUserId = req.params.userId;
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '30', 10)));

  // Verifica que el otro usuario exista
  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: USER_SELECT,
  });
  if (!otherUser) {
    sendError(res, 'Usuario no encontrado', 404);
    return;
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    select: MESSAGE_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  // Marca como leídos los mensajes recibidos no leídos
  await prisma.message.updateMany({
    where: { senderId: otherUserId, receiverId: userId, readAt: null },
    data: { readAt: new Date() },
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  sendSuccess(res, { items, hasMore, nextCursor, user: otherUser });
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { receiverId, content, postId } = req.body;
  const senderId = req.userId!;

  if (senderId === receiverId) {
    sendError(res, 'No puedes enviarte mensajes a ti mismo', 400);
    return;
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    sendError(res, 'Usuario destinatario no encontrado', 404);
    return;
  }

  if (postId) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      sendError(res, 'Publicación no encontrada', 404);
      return;
    }
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content,
      ...(postId && { postId }),
    },
    select: MESSAGE_SELECT,
  });

  sendSuccess(res, message, 201);
};
