import { describe, test, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';
import { createUser, createTrip } from './helpers';

describe('POST /api/trips', () => {
  test('crea viaje con seatsAvailable igual a seatsTotal', async () => {
    const driver = await createUser({ email: 'driver@kiwi.nz' });

    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({
        origin: 'Auckland',
        destination: 'Hamilton',
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        seatsTotal: 3,
        costPerPerson: 20,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.seatsAvailable).toBe(3);
    expect(res.body.data.status).toBe('OPEN');
  });

  test('rechaza departureDate en el pasado', async () => {
    const driver = await createUser({ email: 'driver-past@kiwi.nz' });

    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({
        origin: 'Auckland',
        destination: 'Wellington',
        departureDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        seatsTotal: 2,
      });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/trips/:id/book — flujo de reserva', () => {
  test('decrementa seatsAvailable y status permanece OPEN si quedan asientos', async () => {
    const driver = await createUser({ email: 'driver-open@kiwi.nz' });
    const passenger = await createUser({ email: 'passenger-open@kiwi.nz' });
    const trip = await createTrip(driver, { seatsTotal: 3 });

    const res = await request(app)
      .post(`/api/trips/${trip.id}/book`)
      .set('Authorization', `Bearer ${passenger.accessToken}`);

    expect(res.status).toBe(201);

    const updated = await prisma.trip.findUnique({ where: { id: trip.id } });
    expect(updated!.seatsAvailable).toBe(2);
    expect(updated!.status).toBe('OPEN');
  });

  test('pone status FULL al ocupar el último asiento', async () => {
    const driver = await createUser({ email: 'driver-full@kiwi.nz' });
    const passenger = await createUser({ email: 'passenger-full@kiwi.nz' });
    const trip = await createTrip(driver, { seatsTotal: 1 });

    await request(app)
      .post(`/api/trips/${trip.id}/book`)
      .set('Authorization', `Bearer ${passenger.accessToken}`);

    const updated = await prisma.trip.findUnique({ where: { id: trip.id } });
    expect(updated!.seatsAvailable).toBe(0);
    expect(updated!.status).toBe('FULL');
  });

  test('cancelar reserva FULL vuelve a OPEN y libera el asiento', async () => {
    const driver = await createUser({ email: 'driver-cancel@kiwi.nz' });
    const passenger = await createUser({ email: 'passenger-cancel@kiwi.nz' });
    const trip = await createTrip(driver, { seatsTotal: 1 });

    // Llenar el viaje
    await request(app)
      .post(`/api/trips/${trip.id}/book`)
      .set('Authorization', `Bearer ${passenger.accessToken}`);

    // Cancelar
    const cancelRes = await request(app)
      .delete(`/api/trips/${trip.id}/book`)
      .set('Authorization', `Bearer ${passenger.accessToken}`);

    expect(cancelRes.status).toBe(204);

    const updated = await prisma.trip.findUnique({ where: { id: trip.id } });
    expect(updated!.seatsAvailable).toBe(1);
    expect(updated!.status).toBe('OPEN');
  });

  test('el conductor no puede reservar su propio viaje', async () => {
    const driver = await createUser({ email: 'driver-self@kiwi.nz' });
    const trip = await createTrip(driver, { seatsTotal: 3 });

    const res = await request(app)
      .post(`/api/trips/${trip.id}/book`)
      .set('Authorization', `Bearer ${driver.accessToken}`);

    expect(res.status).toBe(400);
  });

  test('rechaza doble reserva del mismo pasajero con 409', async () => {
    const driver = await createUser({ email: 'driver-double@kiwi.nz' });
    const passenger = await createUser({ email: 'passenger-double@kiwi.nz' });
    const trip = await createTrip(driver, { seatsTotal: 3 });

    await request(app)
      .post(`/api/trips/${trip.id}/book`)
      .set('Authorization', `Bearer ${passenger.accessToken}`);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/book`)
      .set('Authorization', `Bearer ${passenger.accessToken}`);

    expect(res.status).toBe(409);
    // seatsAvailable no debe haber cambiado en la segunda llamada
    const updated = await prisma.trip.findUnique({ where: { id: trip.id } });
    expect(updated!.seatsAvailable).toBe(2);
  });

  test('rechaza reserva sin token con 401', async () => {
    const driver = await createUser({ email: 'driver-noauth@kiwi.nz' });
    const trip = await createTrip(driver, { seatsTotal: 2 });

    const res = await request(app).post(`/api/trips/${trip.id}/book`);
    expect(res.status).toBe(401);
  });

  test('cancelar reserva inexistente devuelve 404', async () => {
    const user = await createUser({ email: 'no-booking@kiwi.nz' });
    const driver = await createUser({ email: 'driver-nobooking@kiwi.nz' });
    const trip = await createTrip(driver, { seatsTotal: 2 });

    const res = await request(app)
      .delete(`/api/trips/${trip.id}/book`)
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/trips', () => {
  test('lista viajes OPEN por defecto', async () => {
    const driver = await createUser({ email: 'driver-list@kiwi.nz' });
    await createTrip(driver, { origin: 'Christchurch', destination: 'Dunedin' });

    const res = await request(app).get('/api/trips');

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.items.every((t: { status: string }) => t.status === 'OPEN')).toBe(true);
  });

  test('filtra por origen (case-insensitive)', async () => {
    const driver = await createUser({ email: 'driver-filter@kiwi.nz' });
    await createTrip(driver, { origin: 'Tauranga', destination: 'Auckland' });
    await createTrip(driver, { origin: 'Wellington', destination: 'Auckland' });

    const res = await request(app).get('/api/trips?origin=tauranga');

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].origin).toBe('Tauranga');
  });
});
