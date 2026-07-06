import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/email';
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

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  await prisma.emailVerificationToken.create({ data: { userId: user.id, token, expiresAt } });

  const verifyUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/verify-email?token=${token}`;

  try {
    await sendVerificationEmail(user.email, user.name, verifyUrl);
  } catch (err) {
    console.error('[register] Error sending verification email:', err);
  }

  sendSuccess(res, null, 201, 'Cuenta creada. Revisa tu correo para verificar tu cuenta.');
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

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

  if (!user.emailVerified) {
    res.status(403).json({ success: false, error: 'EMAIL_NOT_VERIFIED', email: user.email });
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

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Siempre responder igual para no revelar si el email existe
  if (!user) {
    sendSuccess(res, null, 200, 'Si el correo existe recibirás un enlace en breve');
    return;
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

  const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
  } catch (err) {
    console.error('[forgot-password] Error sending email:', err);
  }

  sendSuccess(res, null, 200, 'Si el correo existe recibirás un enlace en breve');
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as { token: string; password: string };

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    sendError(res, 'El enlace es inválido o ya expiró', 400);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  sendSuccess(res, null, 200, 'Contraseña actualizada. Inicia sesión con tu nueva contraseña');
};

// POST /api/auth/verify-email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body as { token: string };

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    sendError(res, 'El enlace es inválido o ya expiró', 400);
    return;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.delete({ where: { token } }),
  ]);

  sendSuccess(res, null, 200, 'Correo verificado correctamente. Ya puedes iniciar sesión.');
};

// POST /api/auth/resend-verification
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user || user.emailVerified) {
    sendSuccess(res, null, 200, 'Si el correo existe y no está verificado, recibirás un nuevo enlace.');
    return;
  }

  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({ data: { userId: user.id, token, expiresAt } });

  const verifyUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/verify-email?token=${token}`;

  try {
    await sendVerificationEmail(user.email, user.name, verifyUrl);
  } catch (err) {
    console.error('[resend-verification] Error sending email:', err);
  }

  sendSuccess(res, null, 200, 'Si el correo existe y no está verificado, recibirás un nuevo enlace.');
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
