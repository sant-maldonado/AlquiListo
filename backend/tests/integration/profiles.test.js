import request from 'supertest';
import app from '../../src/server.js';
import { cleanDatabase, closeDatabase, createTestUser, createTestProfile } from '../helpers/db.js';

async function loginAndGetToken(email, password = '12345678') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('POST /api/profiles/me', () => {
  test('un inquilino puede crear su perfil', async () => {
    await createTestUser({ email: 'inq@test.com', role: 'inquilino' });
    const token = await loginAndGetToken('inq@test.com');

    const res = await request(app)
      .post('/api/profiles/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: 'Juan', last_name: 'Pérez', dni: '30111222' });

    expect(res.status).toBe(201);
    expect(res.body.profile.trust_score).toBe(0);
    expect(res.body.profile.verification_status).toBe('pending');
  });

  test('un propietario NO puede crear un perfil de inquilino', async () => {
    await createTestUser({ email: 'prop@test.com', role: 'propietario' });
    const token = await loginAndGetToken('prop@test.com');

    const res = await request(app)
      .post('/api/profiles/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: 'Juan', last_name: 'Pérez', dni: '30111222' });

    expect(res.status).toBe(403);
  });

  test('no se puede crear un segundo perfil para el mismo usuario', async () => {
    const user = await createTestUser({ email: 'dup@test.com', role: 'inquilino' });
    await createTestProfile(user.id);
    const token = await loginAndGetToken('dup@test.com');

    const res = await request(app)
      .post('/api/profiles/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: 'Otro', last_name: 'Nombre', dni: '30999888' });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/profiles/:id (vista pública)', () => {
  test('un propietario ve la versión reducida del perfil, sin DNI ni ingresos', async () => {
    const inquilino = await createTestUser({ email: 'inq2@test.com', role: 'inquilino' });
    const profile = await createTestProfile(inquilino.id);

    await createTestUser({ email: 'prop2@test.com', role: 'propietario' });
    const token = await loginAndGetToken('prop2@test.com');

    const res = await request(app)
      .get(`/api/profiles/${profile.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.dni).toBeUndefined();
    expect(res.body.profile.monthly_income).toBeUndefined();
    expect(res.body.profile.trust_score).toBeDefined();
  });
});

describe('PUT /api/profiles/me', () => {
  test('el inquilino puede editar su propio perfil', async () => {
    const user = await createTestUser({ email: 'edit@test.com', role: 'inquilino' });
    await createTestProfile(user.id);
    const token = await loginAndGetToken('edit@test.com');

    const res = await request(app)
      .put('/api/profiles/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ monthly_income: 750000 });

    expect(res.status).toBe(200);
    expect(res.body.profile.monthly_income).toBe(750000);
  });
});
