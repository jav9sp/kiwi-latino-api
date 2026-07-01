import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// Cargar .env.test primero (DB de test), luego .env como fallback
dotenv.config({ path: '.env.test', override: true });
dotenv.config();

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    testTimeout: 15_000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      // Secretos fijos para tests — nunca usar en producción
      JWT_SECRET: 'kiwi-test-jwt-secret',
      JWT_REFRESH_SECRET: 'kiwi-test-refresh-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      // DATABASE_URL viene del dotenv.config() de arriba
      DATABASE_URL: process.env.DATABASE_URL ?? '',
    },
  },
});
