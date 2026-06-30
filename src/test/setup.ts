import { beforeEach, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';

// Limpia todas las tablas antes de cada test en orden de dependencia inversa
beforeEach(async () => {
  await prisma.tripBooking.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.message.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.report.deleteMany();
  await prisma.post.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
