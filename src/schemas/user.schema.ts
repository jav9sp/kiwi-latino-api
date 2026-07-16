import { z } from 'zod';

export const OFICIOS = [
  'Barbero / Peluquero',
  'Mecánico',
  'Carpintero',
  'Electricista',
  'Plomero / Gasfiter',
  'Pintor',
  'Cocinero / Chef',
  'Limpieza / Aseo',
  'Jardinero / Paisajista',
  'Manicurista / Esteticista',
  'Tatuador',
  'Fotógrafo / Videógrafo',
  'Traductor / Intérprete',
  'Profesor / Tutor',
  'Contador / Finanzas',
  'Construcción / Albañilería',
  'Costura / Modistería',
  'Diseño Gráfico / Web',
  'Otro',
] as const;

export const updateProfileSchema = z.object({
  body: z.object({
    name:               z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim().optional(),
    countryOrigin:      z.string().optional(),
    cityNz:             z.string().optional(),
    bio:                z.string().max(300, 'La bio no puede superar los 300 caracteres').optional(),
    avatarUrl:          z.string().url('URL de avatar inválida').optional(),
    oficio:              z.enum(OFICIOS).nullable().optional(),
    descripcionServicio: z.string().max(300).nullable().optional(),
    contactoDirectorio:  z.string().max(150).nullable().optional(),
    instagram:           z.string().max(100).nullable().optional(),
    tiktok:              z.string().max(100).nullable().optional(),
    facebook:            z.string().max(150).nullable().optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debes enviar al menos un campo para actualizar' },
  ),
});
