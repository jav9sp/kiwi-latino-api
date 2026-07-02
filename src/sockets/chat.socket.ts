import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../lib/prisma';

export function registerChatHandlers(io: Server): void {
  // Middleware de autenticación: verifica el token JWT en el handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Token requerido'));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;

    // Cada usuario se une a su sala personal al conectarse
    socket.join(`user:${userId}`);

    socket.on('typing', ({ receiverId }: { receiverId: string }) => {
      socket.to(`user:${receiverId}`).emit('typing', { senderId: userId });
    });

    socket.on('stop_typing', ({ receiverId }: { receiverId: string }) => {
      socket.to(`user:${receiverId}`).emit('stop_typing', { senderId: userId });
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
      prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      }).catch(() => {});
    });
  });
}
