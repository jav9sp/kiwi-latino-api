import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  // Fallback solo para prisma generate (no conecta a la DB en esa fase).
  // En producción DATABASE_URL siempre está definida vía Railway.
  datasourceUrl: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/placeholder',
});
