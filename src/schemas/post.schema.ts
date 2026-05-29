import { z } from 'zod';

const POST_MODULES = ['HOUSING', 'JOBS', 'MARKETPLACE', 'TRIPS', 'COMMUNITY'] as const;
const HOUSING_TIPOS = ['pieza', 'casa', 'carpa', 'cabaña'] as const;

const housingMetadataSchema = z.object({
  tipo: z.enum(HOUSING_TIPOS, {
    errorMap: () => ({ message: 'Tipo inválido. Opciones: pieza, casa, carpa, cabaña' }),
  }),
  amueblado: z.boolean().optional(),
  serviciosIncluidos: z.boolean().optional(),
  disponibleDesde: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .optional(),
});

export const createPostSchema = z.object({
  body: z
    .object({
      module: z.enum(POST_MODULES, { errorMap: () => ({ message: 'Módulo inválido' }) }),
      title: z
        .string()
        .min(3, 'El título debe tener al menos 3 caracteres')
        .max(100, 'Máximo 100 caracteres')
        .trim(),
      description: z
        .string()
        .min(10, 'La descripción debe tener al menos 10 caracteres')
        .max(2000, 'Máximo 2000 caracteres')
        .trim(),
      city: z.string().min(2, 'Debes indicar una ciudad'),
      price: z.number().positive('El precio debe ser positivo').optional(),
      currency: z.string().optional(),
      images: z
        .array(z.string().url('URL de imagen inválida'))
        .max(4, 'Máximo 4 imágenes')
        .optional(),
      contactInfo: z.string().max(200).optional(),
      metadata: z.record(z.unknown()).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.module === 'HOUSING') {
        const result = housingMetadataSchema.safeParse(data.metadata);
        if (!result.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: result.error.errors[0]?.message ?? 'Datos del alojamiento inválidos',
            path: ['metadata'],
          });
        }
      }
    }),
});

export const updatePostSchema = z.object({
  body: z
    .object({
      title: z.string().min(3).max(100).trim().optional(),
      description: z.string().min(10).max(2000).trim().optional(),
      city: z.string().min(2).optional(),
      price: z.number().positive().optional(),
      currency: z.string().optional(),
      images: z.array(z.string().url()).max(4).optional(),
      contactInfo: z.string().max(200).optional(),
      metadata: z.record(z.unknown()).optional(),
      status: z
        .enum(['ACTIVE', 'CLOSED'], { errorMap: () => ({ message: 'Estado inválido' }) })
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debes enviar al menos un campo para actualizar',
    }),
  params: z.object({ id: z.string() }),
});

export const listPostsSchema = z.object({
  query: z.object({
    module: z.enum(POST_MODULES).optional(),
    city: z.string().optional(),
    minPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'minPrice inválido')
      .optional(),
    maxPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'maxPrice inválido')
      .optional(),
    page: z.string().regex(/^\d+$/, 'page inválido').optional(),
    limit: z.string().regex(/^\d+$/, 'limit inválido').optional(),
    // Housing specific
    tipoAlojamiento: z.enum(HOUSING_TIPOS).optional(),
    disponibleDesde: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'disponibleDesde inválido')
      .optional(),
  }),
});

export const reportPostSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(5, 'Debes indicar el motivo del reporte')
      .max(200, 'Máximo 200 caracteres'),
    details: z.string().max(500).optional(),
  }),
  params: z.object({ id: z.string() }),
});
