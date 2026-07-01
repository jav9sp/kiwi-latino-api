import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim().optional(),
    countryOrigin: z.string().optional(),
    cityNz: z.string().optional(),
    bio: z.string().max(300, 'La bio no puede superar los 300 caracteres').optional(),
    avatarUrl: z.string().url('URL de avatar inválida').optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debes enviar al menos un campo para actualizar' },
  ),
});
