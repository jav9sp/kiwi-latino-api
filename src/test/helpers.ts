import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateAccessToken } from '../utils/jwt';

let counter = 0;

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  accessToken: string;
}

/**
 * Crea un usuario directamente en BD y devuelve un accessToken válido.
 * Usa 1 ronda de bcrypt para que los tests sean rápidos.
 */
export async function createUser(opts: {
  email?: string;
  password?: string;
  name?: string;
} = {}): Promise<TestUser> {
  counter++;
  const password = opts.password ?? 'test1234';
  const email = opts.email ?? `user${counter}@test.kiwi.nz`;
  const name = opts.name ?? `Test User ${counter}`;

  const passwordHash = await bcrypt.hash(password, 1);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  return { id: user.id, email, name, password, accessToken };
}

/**
 * Crea un viaje en BD con valores por defecto sensatos.
 */
export async function createTrip(
  driver: { id: string },
  opts: {
    seatsTotal?: number;
    origin?: string;
    destination?: string;
  } = {},
) {
  const seatsTotal = opts.seatsTotal ?? 3;
  return prisma.trip.create({
    data: {
      userId: driver.id,
      origin: opts.origin ?? 'Auckland',
      destination: opts.destination ?? 'Wellington',
      departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      seatsTotal,
      seatsAvailable: seatsTotal,
      currency: 'NZD',
    },
  });
}
