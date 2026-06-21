import request from 'supertest';
import { pool } from '../../src/config/db.js';
import app from '../../src/server.js';
import { cleanDatabase, closeDatabase, createTestUser, createTestProfile } from '../helpers/db.js';
import { DocumentModel } from '../../src/models/documentModel.js';
import { VerificationModel } from '../../src/models/verificationModel.js';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('POST /api/verifications/:id/review', () => {
  test('admin aprueba una verificación pendiente', async () => {
    const user = await createTestUser({ email: 'inquilino@test.com', role: 'inquilino' });
    const profile = await createTestProfile(user.id);

    const document = await DocumentModel.create({
      profileId: profile.id,
      guarantorId: null,
      type: 'dni',
      fileUrl: '/uploads/fake.png',
    });

    await DocumentModel.updateAiStatus(document.id, { aiStatus: 'flagged', aiConfidence: null });

    const verification = await VerificationModel.create({ documentId: document.id });

    const admin = await createTestUser({ email: 'admin@test.com', role: 'admin' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: admin.plainPassword });
    const adminToken = loginRes.body.token;

    const res = await request(app)
      .post(`/api/verifications/${verification.id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ result: 'approved', notes: 'Todo en orden' });

    expect(res.status).toBe(200);
    expect(res.body.verification.result).toBe('approved');
    expect(res.body.verification.reviewed_by).toBe(admin.email);

    const profileResult = await pool.query(
      'SELECT trust_score, verification_status FROM profiles WHERE id = $1',
      [profile.id]
    );
    expect(profileResult.rows[0].trust_score).toBeGreaterThanOrEqual(15);
    expect(profileResult.rows[0].verification_status).toBe('verified');
  });

  test('inquilino no puede revisar (403)', async () => {
    const user = await createTestUser({ email: 'inquilino2@test.com', role: 'inquilino' });
    const profile = await createTestProfile(user.id);
    const doc = await DocumentModel.create({
      profileId: profile.id,
      guarantorId: null,
      type: 'dni',
      fileUrl: '/uploads/fake.png',
    });
    await DocumentModel.updateAiStatus(doc.id, { aiStatus: 'flagged', aiConfidence: null });
    const ver = await VerificationModel.create({ documentId: doc.id });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.plainPassword });
    const token = loginRes.body.token;

    const res = await request(app)
      .post(`/api/verifications/${ver.id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ result: 'approved', notes: '' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/verifications/queue', () => {
  test('admin puede ver la cola de verificación', async () => {
    const user = await createTestUser({ email: 'inquilino3@test.com', role: 'inquilino' });
    const profile = await createTestProfile(user.id);
    const doc = await DocumentModel.create({
      profileId: profile.id,
      guarantorId: null,
      type: 'dni',
      fileUrl: '/uploads/fake.png',
    });
    await DocumentModel.updateAiStatus(doc.id, { aiStatus: 'flagged', aiConfidence: null });
    await VerificationModel.create({ documentId: doc.id });

    const admin = await createTestUser({ email: 'admin3@test.com', role: 'admin' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: admin.plainPassword });
    const adminToken = loginRes.body.token;

    const res = await request(app)
      .get('/api/verifications/queue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.queue.length).toBeGreaterThanOrEqual(1);
  });

  test('inquilino no puede ver la cola (403)', async () => {
    const user = await createTestUser({ email: 'inquilino4@test.com', role: 'inquilino' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.plainPassword });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/verifications/queue')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('usuario no autenticado recibe 401', async () => {
    const res = await request(app).get('/api/verifications/queue');
    expect(res.status).toBe(401);
  });
});
