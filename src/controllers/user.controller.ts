import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

// GET /api/users/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      countryOrigin: true,
      cityNz: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    sendError(res, 'Usuario no encontrado', 404);
    return;
  }

  sendSuccess(res, user);
};

// PATCH /api/users/me
export const updateMe = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId!;
  const { name, countryOrigin, cityNz, bio, avatarUrl } = req.body as {
    name?: string;
    countryOrigin?: string;
    cityNz?: string;
    bio?: string;
    avatarUrl?: string;
  };

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(countryOrigin !== undefined && { countryOrigin }),
      ...(cityNz !== undefined && { cityNz }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      countryOrigin: true,
      cityNz: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });

  sendSuccess(res, user, 200, 'Perfil actualizado');
};

// PATCH /api/users/me/password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId!;
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { sendError(res, 'Usuario no encontrado', 404); return; }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) { sendError(res, 'La contraseña actual es incorrecta', 400); return; }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  sendSuccess(res, null, 200, 'Contraseña actualizada correctamente');
};

// GET /api/users/:id
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      countryOrigin: true,
      cityNz: true,
      avatarUrl: true,
      bio: true,
      lastSeenAt: true,
      createdAt: true,
      posts: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          module: true,
          title: true,
          city: true,
          price: true,
          images: true,
          createdAt: true,
        },
      },
      tripsCreated: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          origin: true,
          destination: true,
          departureDate: true,
          seatsTotal: true,
          seatsAvailable: true,
          costPerPerson: true,
          currency: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    sendError(res, 'Usuario no encontrado', 404);
    return;
  }

  sendSuccess(res, user);
};

// GET /api/users/me/onboarding
export const getOnboarding = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  const [userData, postCount, messageCount, likeCount, savedCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, bio: true },
    }),
    prisma.post.count({ where: { userId, status: { not: 'DELETED' } } }),
    prisma.message.count({ where: { senderId: userId } }),
    prisma.postLike.count({ where: { userId } }),
    prisma.savedPost.count({ where: { userId } }),
  ]);

  sendSuccess(res, {
    avatar:  !!userData?.avatarUrl,
    bio:     !!(userData?.bio?.trim()),
    post:    postCount > 0,
    message: messageCount > 0,
    like:    likeCount > 0,
    saved:   savedCount > 0,
  });
};
