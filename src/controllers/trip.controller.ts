import { Request, Response } from 'express';
import { TripStatus, BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

const TRIP_SELECT = {
  id: true,
  origin: true,
  destination: true,
  departureDate: true,
  seatsTotal: true,
  seatsAvailable: true,
  costPerPerson: true,
  currency: true,
  notes: true,
  status: true,
  createdAt: true,
  userId: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
} as const;

export const getTrips = async (req: Request, res: Response): Promise<void> => {
  const { origin, destination, date, status } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (status) where.status = status as TripStatus;
  else where.status = { in: ['OPEN', 'FULL'] as TripStatus[] };

  if (origin) where.origin = { contains: origin, mode: 'insensitive' };
  if (destination) where.destination = { contains: destination, mode: 'insensitive' };

  if (date) {
    const d = new Date(date);
    const from = new Date(d);
    from.setDate(from.getDate() - 3);
    const to = new Date(d);
    to.setDate(to.getDate() + 3);
    to.setHours(23, 59, 59, 999);
    where.departureDate = { gte: from, lte: to };
  }

  const [total, items] = await Promise.all([
    prisma.trip.count({ where }),
    prisma.trip.findMany({
      where,
      select: TRIP_SELECT,
      orderBy: { departureDate: 'asc' },
      skip,
      take: limit,
    }),
  ]);

  sendSuccess(res, { items, total, page, limit, hasMore: skip + items.length < total });
};

export const createTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { origin, destination, departureDate, seatsTotal, costPerPerson, currency, notes } = req.body;

  const trip = await prisma.trip.create({
    data: {
      userId: req.userId!,
      origin,
      destination,
      departureDate: new Date(departureDate),
      seatsTotal,
      seatsAvailable: seatsTotal,
      ...(costPerPerson !== undefined && { costPerPerson }),
      currency: currency ?? 'NZD',
      ...(notes && { notes }),
    },
    select: TRIP_SELECT,
  });

  sendSuccess(res, trip, 201);
};

export const getTrip = async (req: Request, res: Response): Promise<void> => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      origin: true,
      destination: true,
      departureDate: true,
      seatsTotal: true,
      seatsAvailable: true,
      costPerPerson: true,
      currency: true,
      notes: true,
      status: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
      bookings: {
        select: {
          id: true,
          seats: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!trip) {
    sendError(res, 'Viaje no encontrado', 404);
    return;
  }

  sendSuccess(res, trip);
};

export const bookTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tripId = req.params.id;
  const userId = req.userId!;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.status === 'CANCELLED' || trip.status === 'COMPLETED') {
    sendError(res, 'Viaje no encontrado o no disponible', 404);
    return;
  }
  if (trip.userId === userId) {
    sendError(res, 'No puedes reservar en tu propio viaje', 400);
    return;
  }
  if (trip.seatsAvailable <= 0 || trip.status === 'FULL') {
    sendError(res, 'No hay asientos disponibles', 409);
    return;
  }

  const existing = await prisma.tripBooking.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });
  if (existing) {
    sendError(res, 'Ya tienes una solicitud en este viaje', 409);
    return;
  }

  const booking = await prisma.tripBooking.create({
    data: { tripId, userId, seats: 1, status: 'PENDING' },
    select: { id: true, seats: true, status: true, createdAt: true },
  });

  sendSuccess(res, booking, 201);
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tripId = req.params.id;
  const userId = req.userId!;

  const booking = await prisma.tripBooking.findUnique({
    where: { tripId_userId: { tripId, userId } },
    include: { trip: true },
  });

  if (!booking) {
    sendError(res, 'No tienes una solicitud en este viaje', 404);
    return;
  }
  if (booking.trip.status === 'COMPLETED' || booking.trip.status === 'CANCELLED') {
    sendError(res, 'No se puede cancelar una reserva en un viaje terminado', 400);
    return;
  }

  const wasAccepted = booking.status === BookingStatus.ACCEPTED;
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.tripBooking.delete({ where: { tripId_userId: { tripId, userId } } }),
  ];

  if (wasAccepted) {
    const newSeats = booking.trip.seatsAvailable + booking.seats;
    ops.push(prisma.trip.update({
      where: { id: tripId },
      data: { seatsAvailable: newSeats, ...(booking.trip.status === 'FULL' && { status: 'OPEN' }) },
    }));
  }

  await prisma.$transaction(ops);
  res.status(204).send();
};

export const acceptBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: tripId, bookingId } = req.params;
  const userId = req.userId!;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.userId !== userId) {
    sendError(res, 'No autorizado', 403);
    return;
  }

  const booking = await prisma.tripBooking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.tripId !== tripId || booking.status !== BookingStatus.PENDING) {
    sendError(res, 'Solicitud no encontrada o ya procesada', 400);
    return;
  }

  if (trip.seatsAvailable < booking.seats) {
    sendError(res, 'No hay asientos disponibles', 409);
    return;
  }

  const newSeats = trip.seatsAvailable - booking.seats;

  await prisma.$transaction([
    prisma.tripBooking.update({ where: { id: bookingId }, data: { status: 'ACCEPTED' } }),
    prisma.trip.update({
      where: { id: tripId },
      data: { seatsAvailable: newSeats, ...(newSeats === 0 && { status: 'FULL' }) },
    }),
  ]);

  sendSuccess(res, null, 200, 'Solicitud aceptada');
};

export const rejectBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: tripId, bookingId } = req.params;
  const userId = req.userId!;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.userId !== userId) {
    sendError(res, 'No autorizado', 403);
    return;
  }

  const booking = await prisma.tripBooking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.tripId !== tripId || booking.status === BookingStatus.REJECTED) {
    sendError(res, 'Solicitud no encontrada o ya rechazada', 400);
    return;
  }

  const wasAccepted = booking.status === BookingStatus.ACCEPTED;
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.tripBooking.update({ where: { id: bookingId }, data: { status: 'REJECTED' } }),
  ];

  if (wasAccepted) {
    ops.push(prisma.trip.update({
      where: { id: tripId },
      data: {
        seatsAvailable: { increment: booking.seats },
        ...(trip.status === 'FULL' && { status: 'OPEN' }),
      },
    }));
  }

  await prisma.$transaction(ops);
  sendSuccess(res, null, 200, 'Solicitud rechazada');
};
