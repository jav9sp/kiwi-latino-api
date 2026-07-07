import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

async function assertAdmin(req: AuthenticatedRequest, res: Response): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    sendError(res, 'Panel de administrador no configurado', 403);
    return false;
  }
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { email: true },
  });
  if (!user || user.email !== adminEmail) {
    sendError(res, 'Acceso denegado', 403);
    return false;
  }
  return true;
}

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!(await assertAdmin(req, res))) return;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true,
      avatarUrl: true, countryOrigin: true, cityNz: true, createdAt: true,
    },
  });

  sendSuccess(res, users);
};

export const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!(await assertAdmin(req, res))) return;

  const weekAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    usersThisWeek,
    usersThisMonth,
    totalPosts,
    activePosts,
    postsByModule,
    totalTrips,
    tripsByStatus,
    totalMessages,
    totalComments,
    totalLikes,
    recentUsers,
    usersByCountry,
    usersByCity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.post.count({ where: { status: { not: 'DELETED' } } }),
    prisma.post.count({ where: { status: 'ACTIVE' } }),
    prisma.post.groupBy({
      by: ['module'],
      _count: { _all: true },
      where: { status: 'ACTIVE' },
    }),
    prisma.trip.count(),
    prisma.trip.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.message.count(),
    prisma.comment.count(),
    prisma.postLike.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, email: true, countryOrigin: true, cityNz: true, createdAt: true },
    }),
    prisma.user.groupBy({
      by: ['countryOrigin'],
      _count: { _all: true },
      where: { countryOrigin: { not: null } },
      orderBy: { _count: { countryOrigin: 'desc' } },
      take: 8,
    }),
    prisma.user.groupBy({
      by: ['cityNz'],
      _count: { _all: true },
      where: { cityNz: { not: null } },
      orderBy: { _count: { cityNz: 'desc' } },
      take: 8,
    }),
  ]);

  sendSuccess(res, {
    users: {
      total:      totalUsers,
      thisWeek:   usersThisWeek,
      thisMonth:  usersThisMonth,
      byCountry:  usersByCountry.map((r) => ({ country: r.countryOrigin, count: r._count._all })),
      byCity:     usersByCity.map((r) => ({ city: r.cityNz, count: r._count._all })),
    },
    posts: {
      total:    totalPosts,
      active:   activePosts,
      byModule: postsByModule.map((r) => ({ module: r.module, count: r._count._all })),
    },
    trips: {
      total:    totalTrips,
      byStatus: tripsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
    },
    engagement: {
      messages: totalMessages,
      comments: totalComments,
      likes:    totalLikes,
    },
    recentUsers,
  });
};
