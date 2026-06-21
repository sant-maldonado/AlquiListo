import { jest } from '@jest/globals';
jest.unstable_mockModule('../../src/services/emailService.js', () => ({
  EmailService: { sendGuarantorInvite: jest.fn() },
}));

let request, app, db;

beforeAll(async () => {
  request = (await import('supertest')).default;
  app = (await import('../../src/server.js')).default;
  db = await import('../helpers/db.js');
});

async function loginAndGetToken(email, password = '12345678') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

beforeEach(async () => {
  await db.cleanDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

describe('POST /api/guarantors', () => {
  test('un inquilino con perfil puede agregar un garante', async () => {
    const user = await db.createTestUser({ email: 'g1@test.com', role: 'inquilino' });
    await db.createTestProfile(user.id);
    const token = await loginAndGetToken('g1@test.com');

    const res = await request(app)
      .post('/api/guarantors')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'caucion', full_name: 'Aseguradora SA', email: 'caucion@aseguradora.com' });

    expect(res.status).toBe(201);
    expect(res.body.guarantor.status).toBe('pending');
    expect(res.body.guarantor.invite_token).toBeDefined();
    expect(res.body.invite_link).toContain(res.body.guarantor.invite_token);
  });

  test('rechaza un type inválido', async () => {
    const user = await db.createTestUser({ email: 'g2@test.com', role: 'inquilino' });
    await db.createTestProfile(user.id);
    const token = await loginAndGetToken('g2@test.com');

    const res = await request(app)
      .post('/api/guarantors')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'inventado', full_name: 'Alguien' });

    expect(res.status).toBe(400);
  });

  test('rechaza si el inquilino todavía no tiene perfil creado', async () => {
    await db.createTestUser({ email: 'g3@test.com', role: 'inquilino' });
    const token = await loginAndGetToken('g3@test.com');

    const res = await request(app)
      .post('/api/guarantors')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'caucion', full_name: 'Alguien' });

    expect(res.status).toBe(404);
  });
});

describe('Aislamiento entre inquilinos (seguridad)', () => {
  test('un inquilino no puede ver el garante de otro inquilino', async () => {
    const userA = await db.createTestUser({ email: 'userA@test.com', role: 'inquilino' });
    const profileA = await db.createTestProfile(userA.id);
    const guarantorA = await db.createTestGuarantor(profileA.id);

    await db.createTestUser({ email: 'userB@test.com', role: 'inquilino' });
    const tokenB = await loginAndGetToken('userB@test.com');

    const res = await request(app)
      .get(`/api/guarantors/${guarantorA.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });

  test('un inquilino no puede borrar el garante de otro inquilino', async () => {
    const userA = await db.createTestUser({ email: 'userC@test.com', role: 'inquilino' });
    const profileA = await db.createTestProfile(userA.id);
    const guarantorA = await db.createTestGuarantor(profileA.id);

    await db.createTestUser({ email: 'userD@test.com', role: 'inquilino' });
    const tokenD = await loginAndGetToken('userD@test.com');

    const res = await request(app)
      .delete(`/api/guarantors/${guarantorA.id}`)
      .set('Authorization', `Bearer ${tokenD}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/guarantors/invite/:token (acceso público del garante)', () => {
  test('el garante accede con su token sin necesitar login', async () => {
    const user = await db.createTestUser({ email: 'g4@test.com', role: 'inquilino' });
    const profile = await db.createTestProfile(user.id);
    const guarantor = await db.createTestGuarantor(profile.id);

    const res = await request(app).get(`/api/guarantors/invite/${guarantor.invite_token}`);

    expect(res.status).toBe(200);
    expect(res.body.guarantor.full_name).toBe(guarantor.full_name);
    expect(res.body.guarantor.profile_id).toBeUndefined();
  });

  test('un token inválido devuelve 404', async () => {
    const res = await request(app).get('/api/guarantors/invite/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
