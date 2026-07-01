import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { sendPushNotifications } from '../utils/push';
import { getIO } from '../lib/socket';
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

  // Query 1: todos los mensajes del usuario, ordenados desc (cap 500 para no traer historia infinita)
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    select: MESSAGE_SELECT,
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  if (messages.length === 0) {
    sendSuccess(res, []);
    return;
  }

  // Deduplicar en memoria: primer mensaje de cada interlocutor = el más reciente
  const seenPartners = new Set<string>();
  const lastMessageByPartner = new Map<string, (typeof messages)[0]>();
  const partnerIds: string[] = [];

  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!seenPartners.has(partnerId)) {
      seenPartners.add(partnerId);
      lastMessageByPartner.set(partnerId, msg);
      partnerIds.push(partnerId);
    }
  }

  // Query 2: conteo de no leídos por interlocutor (1 sola query con groupBy)
  const unreadGroups = await prisma.message.groupBy({
    by: ['senderId'],
    where: { receiverId: userId, readAt: null, senderId: { in: partnerIds } },
    _count: { id: true },
  });
  const unreadMap = new Map(unreadGroups.map((g) => [g.senderId, g._count.id]));

  // Query 3: datos de todos los interlocutores (1 sola query)
  const partners = await prisma.user.findMany({
    where: { id: { in: partnerIds } },
    select: USER_SELECT,
  });
  const partnerMap = new Map(partners.map((p) => [p.id, p]));

  // Ensamblar en el orden original (ya ordenado por más reciente)
  const conversations = partnerIds.map((partnerId) => ({
    user: partnerMap.get(partnerId),
    lastMessage: lastMessageByPartner.get(partnerId),
    unreadCount: unreadMap.get(partnerId) ?? 0,
  }));

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

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, pushTokens: { select: { token: true } } },
  });
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

  // Emitir el mensaje en tiempo real al receptor y al remitente (multi-dispositivo)
  const io = getIO();
  if (io) {
    io.to(`user:${receiverId}`).to(`user:${senderId}`).emit('new_message', message);
  }

  // F3-009: notificar al receptor si tiene push tokens (best-effort, no bloquea la respuesta)
  if (receiver.pushTokens.length > 0) {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true },
    });
    void sendPushNotifications(
      receiver.pushTokens.map(({ token }) => ({
        to: token,
        sound: 'default' as const,
        title: sender?.name ?? 'Nuevo mensaje',
        body: content.length > 100 ? `${content.slice(0, 100)}…` : content,
        data: { type: 'new_message', fromUserId: senderId },
      })),
    );
  }
};
