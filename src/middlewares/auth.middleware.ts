import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Token de autenticación requerido', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    sendError(res, 'Token inválido o expirado', 401);
  }
};
