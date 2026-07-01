import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    receiverId: z.string().min(1, 'Debes indicar el destinatario'),
    content: z
      .string()
      .min(1, 'El mensaje no puede estar vacío')
      .max(1000, 'Máximo 1000 caracteres')
      .trim(),
    postId: z.string().optional(),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({ userId: z.string() }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.string().regex(/^\d+$/, 'limit inválido').optional(),
  }),
});
