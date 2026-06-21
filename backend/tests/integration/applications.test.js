import request from 'supertest';
import { pool } from '../../src/config/db.js';
import app from '../../src/server.js';
import {
  cleanDatabase,
  closeDatabase,
  createTestUser,
  createTestProfile,
  createTestProperty,
} from '../helpers/db.js';

async function loginAndGetToken(email, password = '12345678') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

async function verifyProfile(profileId, trustScore = 50) {
  await pool.query(
    `UPDATE profiles SET verification_status = 'verified', trust_score = $2 WHERE id = $1`,
    [profileId, trustScore]
  );
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('POST /api/applications', () => {
  test('un inquilino con perfil verificado puede postularse', async () => {
    const owner = await createTestUser({ email: 'owner1@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'published' });

    const tenant = await createTestUser({ email: 'tenant1@test.com', role: 'inquilino' });
    const profile = await createTestProfile(tenant.id);
    await verifyProfile(profile.id, 70);
    const token = await loginAndGetToken('tenant1@test.com');

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ property_id: property.id });

    expect(res.status).toBe(201);
    expect(res.body.application.status).toBe('pending');
    expect(res.body.application.trust_score_snapshot).toBe(70);
  });

  test('rechaza si el perfil NO está verificado', async () => {
    const owner = await createTestUser({ email: 'owner2@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'published' });

    const tenant = await createTestUser({ email: 'tenant2@test.com', role: 'inquilino' });
    await createTestProfile(tenant.id);
    const token = await loginAndGetToken('tenant2@test.com');

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ property_id: property.id });

    expect(res.status).toBe(403);
  });

  test('rechaza si la propiedad no está publicada', async () => {
    const owner = await createTestUser({ email: 'owner3@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'draft' });

    const tenant = await createTestUser({ email: 'tenant3@test.com', role: 'inquilino' });
    const profile = await createTestProfile(tenant.id);
    await verifyProfile(profile.id);
    const token = await loginAndGetToken('tenant3@test.com');

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ property_id: property.id });

    expect(res.status).toBe(404);
  });

  test('un propietario no puede postularse (requireRole inquilino)', async () => {
    const owner = await createTestUser({ email: 'owner4@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'published' });
    const token = await loginAndGetToken('owner4@test.com');

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ property_id: property.id });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/applications/property/:propertyId', () => {
  test('el dueño ve los postulantes ordenados por score', async () => {
    const owner = await createTestUser({ email: 'owner5@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'published' });

    const tenantA = await createTestUser({ email: 'tenantA@test.com', role: 'inquilino' });
    const profileA = await createTestProfile(tenantA.id, { dni: '30111111' });
    await verifyProfile(profileA.id, 40);

    const tenantB = await createTestUser({ email: 'tenantB@test.com', role: 'inquilino' });
    const profileB = await createTestProfile(tenantB.id, { dni: '30222222' });
    await verifyProfile(profileB.id, 90);

    const tokenA = await loginAndGetToken('tenantA@test.com');
    const tokenB = await loginAndGetToken('tenantB@test.com');

    await request(app).post('/api/applications').set('Authorization', `Bearer ${tokenA}`).send({ property_id: property.id });
    await request(app).post('/api/applications').set('Authorization', `Bearer ${tokenB}`).send({ property_id: property.id });

    const ownerToken = await loginAndGetToken('owner5@test.com');
    const res = await request(app)
      .get(`/api/applications/property/${property.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(2);
    expect(res.body.applications[0].trust_score_snapshot).toBe(90);
    expect(res.body.applications[0].dni).toBeUndefined();
  });

  test('otro propietario no puede ver los postulantes de una propiedad ajena', async () => {
    const owner = await createTestUser({ email: 'owner6@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'published' });

    await createTestUser({ email: 'owner7@test.com', role: 'propietario' });
    const otherToken = await loginAndGetToken('owner7@test.com');

    const res = await request(app)
      .get(`/api/applications/property/${property.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/applications/:id/accept', () => {
  test('aceptar una postulación rechaza al resto y marca la propiedad como alquilada', async () => {
    const owner = await createTestUser({ email: 'owner8@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'published' });

    const tenantA = await createTestUser({ email: 'tenantC@test.com', role: 'inquilino' });
    const profileA = await createTestProfile(tenantA.id, { dni: '30333333' });
    await verifyProfile(profileA.id);
    const tokenA = await loginAndGetToken('tenantC@test.com');
    const appA = await request(app).post('/api/applications').set('Authorization', `Bearer ${tokenA}`).send({ property_id: property.id });

    const tenantB = await createTestUser({ email: 'tenantD@test.com', role: 'inquilino' });
    const profileB = await createTestProfile(tenantB.id, { dni: '30444444' });
    await verifyProfile(profileB.id);
    const tokenB = await loginAndGetToken('tenantD@test.com');
    const appB = await request(app).post('/api/applications').set('Authorization', `Bearer ${tokenB}`).send({ property_id: property.id });

    const ownerToken = await loginAndGetToken('owner8@test.com');
    const acceptRes = await request(app)
      .post(`/api/applications/${appA.body.application.id}/accept`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.application.status).toBe('accepted');

    const checkB = await pool.query('SELECT status FROM applications WHERE id = $1', [appB.body.application.id]);
    expect(checkB.rows[0].status).toBe('rejected');

    const checkProperty = await pool.query('SELECT status FROM properties WHERE id = $1', [property.id]);
    expect(checkProperty.rows[0].status).toBe('rented');
  });

  test('no se puede aceptar una postulación que ya fue resuelta', async () => {
    const owner = await createTestUser({ email: 'owner9@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'published' });

    const tenant = await createTestUser({ email: 'tenantE@test.com', role: 'inquilino' });
    const profile = await createTestProfile(tenant.id);
    await verifyProfile(profile.id);
    const token = await loginAndGetToken('tenantE@test.com');
    const appRes = await request(app).post('/api/applications').set('Authorization', `Bearer ${token}`).send({ property_id: property.id });

    const ownerToken = await loginAndGetToken('owner9@test.com');
    await request(app).post(`/api/applications/${appRes.body.application.id}/accept`).set('Authorization', `Bearer ${ownerToken}`);

    const secondAttempt = await request(app)
      .post(`/api/applications/${appRes.body.application.id}/accept`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(secondAttempt.status).toBe(400);
  });
});

describe('GET /api/applications/mine', () => {
  test('el inquilino ve sus propias postulaciones con datos de la propiedad', async () => {
    const owner = await createTestUser({ email: 'owner10@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'published', title: 'Depto lindo' });

    const tenant = await createTestUser({ email: 'tenantF@test.com', role: 'inquilino' });
    const profile = await createTestProfile(tenant.id);
    await verifyProfile(profile.id);
    const token = await loginAndGetToken('tenantF@test.com');

    await request(app).post('/api/applications').set('Authorization', `Bearer ${token}`).send({ property_id: property.id });

    const res = await request(app).get('/api/applications/mine').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
    expect(res.body.applications[0].property_title).toBe('Depto lindo');
  });
});
