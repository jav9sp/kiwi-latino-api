import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';

// Extrae la fecha de expiración del payload JWT (campo `exp` en segundos epoch)
function tokenExpiresAt(token: string): Date {
  const decoded = jwt.decode(token) as { exp: number };
  return new Date(decoded.exp * 1000);
}

// Campos seguros del usuario para devolver en respuestas (sin passwordHash)
function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  countryOrigin: string | null;
  cityNz: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    countryOrigin: user.countryOrigin,
    cityNz: user.cityNz,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, countryOrigin, cityNz } = req.body as {
    email: string;
    password: string;
    name: string;
    countryOrigin?: string;
    cityNz?: string;
  };

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    sendError(res, 'Este correo ya está registrado', 409);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name: name.trim(),
      countryOrigin: countryOrigin ?? null,
      cityNz: cityNz ?? null,
    },
  });

  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: tokenExpiresAt(refreshToken),
    },
  });

  sendSuccess(
    res,
    { user: sanitizeUser(user), tokens: { accessToken, refreshToken } },
    201,
    'Registro exitoso',
  );
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  console.log(`${typeof(email)} - ${typeof(password)}`)

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    sendError(res, 'Credenciales incorrectas', 401);
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    sendError(res, 'Credenciales incorrectas', 401);
    return;
  }

  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await Promise.all([
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: tokenExpiresAt(refreshToken),
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    }),
  ]);

  sendSuccess(res, { user: sanitizeUser(user), tokens: { accessToken, refreshToken } });
};

// POST /api/auth/refresh
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };

  // Verificar firma JWT
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    sendError(res, 'Refresh token inválido o expirado', 401);
    return;
  }

  // Verificar que existe en BD y no expiró
  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    // Limpiar si expiró para no acumular registros
    if (stored) await prisma.refreshToken.delete({ where: { token: refreshToken } });
    sendError(res, 'Refresh token inválido o expirado', 401);
    return;
  }

  // Rotación: eliminar el token usado e emitir un nuevo par
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const newPayload = { userId: payload.userId, email: payload.email };
  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  await prisma.refreshToken.create({
    data: {
      userId: payload.userId,
      token: newRefreshToken,
      expiresAt: tokenExpiresAt(newRefreshToken),
    },
  });

  sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
};

// POST /api/auth/logout  (requiere authenticate)
export const logout = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId!;
  const { refreshToken } = req.body as { refreshToken?: string };

  if (refreshToken) {
    // Logout de este dispositivo: eliminar solo el token enviado (verificando ownership)
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken, userId } });
  } else {
    // Logout de todos los dispositivos
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  sendSuccess(res, null, 200, 'Sesión cerrada');
};
