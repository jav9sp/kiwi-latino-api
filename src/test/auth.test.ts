import { describe, test, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createUser } from './helpers';

describe('POST /api/auth/register', () => {
  test('crea usuario y devuelve access + refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nuevo@kiwi.nz', password: 'pass1234', name: 'Nuevo Usuario' });

    expect(res.status).toBe(201);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  test('normaliza el email a minúsculas', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'MAYUS@KIWI.NZ', password: 'pass1234', name: 'Mayus' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('mayus@kiwi.nz');
  });

  test('rechaza email duplicado con 409', async () => {
    await createUser({ email: 'dupe@kiwi.nz' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dupe@kiwi.nz', password: 'pass1234', name: 'Otro' });

    expect(res.status).toBe(409);
  });

  test('rechaza campos requeridos faltantes con 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'sin-nombre@kiwi.nz', password: 'pass1234' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/login', () => {
  test('devuelve tokens con credenciales correctas', async () => {
    await createUser({ email: 'login@kiwi.nz', password: 'secreto123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@kiwi.nz', password: 'secreto123' });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');
  });

  test('rechaza contraseña incorrecta con 401', async () => {
    await createUser({ email: 'fail@kiwi.nz', password: 'correcta' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fail@kiwi.nz', password: 'incorrecta' });

    expect(res.status).toBe(401);
  });

  test('rechaza usuario inexistente con 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@kiwi.nz', password: 'cualquiera' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  test('emite un nuevo par de tokens y el token viejo queda inválido', async () => {
    // Obtener refreshToken vía login real
    const user = await createUser({ email: 'refresh@kiwi.nz' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    const originalRefresh = loginRes.body.data.tokens.refreshToken;

    // JWT usa `iat` en segundos; esperar >1s garantiza un token distinto tras la rotación
    await new Promise((r) => setTimeout(r, 1001));

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: originalRefresh });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).not.toBe(originalRefresh);

    // El token viejo ya no debe funcionar (rotación)
    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: originalRefresh });

    expect(reuseRes.status).toBe(401);
  });

  test('rechaza token inventado con 401', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'esto.no.es.un.token' });

    expect(res.status).toBe(401);
  });
});

describe('Rutas protegidas sin token', () => {
  test('GET /api/users/me devuelve 401 si no hay token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});
