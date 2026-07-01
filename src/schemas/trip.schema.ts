import { z } from 'zod';

export const createTripSchema = z.object({
  body: z.object({
    origin: z.string().min(2, 'Debes indicar el origen').max(100).trim(),
    destination: z.string().min(2, 'Debes indicar el destino').max(100).trim(),
    departureDate: z
      .string()
      .datetime({ offset: true, message: 'Fecha inválida (ISO 8601 con zona horaria)' })
      .refine((d) => new Date(d) > new Date(), {
        message: 'La fecha de partida debe ser en el futuro',
      }),
    seatsTotal: z
      .number({ invalid_type_error: 'seatsTotal debe ser un número' })
      .int('seatsTotal debe ser entero')
      .min(1, 'Mínimo 1 asiento')
      .max(20, 'Máximo 20 asientos'),
    costPerPerson: z.number().positive('El costo debe ser positivo').optional(),
    currency: z.string().optional(),
    notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
  }),
});

export const listTripsSchema = z.object({
  query: z.object({
    origin: z.string().optional(),
    destination: z.string().optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
      .optional(),
    status: z.enum(['OPEN', 'FULL', 'COMPLETED', 'CANCELLED']).optional(),
    page: z.string().regex(/^\d+$/, 'page inválido').optional(),
    limit: z.string().regex(/^\d+$/, 'limit inválido').optional(),
  }),
});
