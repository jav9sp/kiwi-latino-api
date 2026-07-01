import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export const savePushToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { token } = req.body as { token?: string };

  if (!token || typeof token !== 'string' || !token.startsWith('ExponentPushToken[')) {
    sendError(res, 'Token de push inválido', 400);
    return;
  }

  // Upsert: el mismo token puede cambiar de usuario (ej. logout + login de otro)
  await prisma.userPushToken.upsert({
    where: { token },
    update: { userId: req.userId! },
    create: { userId: req.userId!, token },
  });

  sendSuccess(res, null, 200, 'Token registrado');
};
