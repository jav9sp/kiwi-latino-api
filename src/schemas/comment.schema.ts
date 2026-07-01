import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z
      .string()
      .min(1, 'El comentario no puede estar vacío')
      .max(500, 'Máximo 500 caracteres')
      .trim(),
  }),
  params: z.object({ id: z.string() }),
});

export const listCommentsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'page inválido').optional(),
    limit: z.string().regex(/^\d+$/, 'limit inválido').optional(),
  }),
  params: z.object({ id: z.string() }),
});
