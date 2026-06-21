import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import request from 'supertest';
import app from '../../src/server.js';
import {
  cleanDatabase,
  closeDatabase,
  createTestUser,
  createTestProfile,
  createTestGuarantor,
} from '../helpers/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');
const FAKE_IMAGE_PATH = join(FIXTURES_DIR, 'fake-dni.png');

beforeAll(() => {
  if (!existsSync(FIXTURES_DIR)) mkdirSync(FIXTURES_DIR, { recursive: true });
  const minimalPng = Buffer.from(
    '89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000a49444154789c6360000002000100b3cb4e5a0000000049454e44ae426082',
    'hex'
  );
  writeFileSync(FAKE_IMAGE_PATH, minimalPng);
});

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

describe('POST /api/documents (inquilino)', () => {
  test('el inquilino puede subir un documento a su propio perfil', async () => {
    const user = await createTestUser({ email: 'doc1@test.com', role: 'inquilino' });
    await createTestProfile(user.id);
    const token = await loginAndGetToken('doc1@test.com');

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('type', 'dni')
      .attach('file', FAKE_IMAGE_PATH);

    expect(res.status).toBe(201);
    expect(res.body.document.type).toBe('dni');
    expect(res.body.document.file_url).toMatch(/^\/uploads\//);
    expect(res.body.document.ai_status).toBe('pending');
  });

  test('rechaza un type inválido', async () => {
    const user = await createTestUser({ email: 'doc2@test.com', role: 'inquilino' });
    await createTestProfile(user.id);
    const token = await loginAndGetToken('doc2@test.com');

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('type', 'tipo_invalido')
      .attach('file', FAKE_IMAGE_PATH);

    expect(res.status).toBe(400);
  });

  test('rechaza sin archivo adjunto', async () => {
    const user = await createTestUser({ email: 'doc3@test.com', role: 'inquilino' });
    await createTestProfile(user.id);
    const token = await loginAndGetToken('doc3@test.com');

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('type', 'dni');

    expect(res.status).toBe(400);
  });
});

describe('POST /api/documents (garante con token, sin login)', () => {
  test('el garante puede subir un documento usando su invite token', async () => {
    const user = await createTestUser({ email: 'doc4@test.com', role: 'inquilino' });
    const profile = await createTestProfile(user.id);
    const guarantor = await createTestGuarantor(profile.id);

    const res = await request(app)
      .post('/api/documents')
      .set('X-Guarantor-Token', guarantor.invite_token)
      .field('type', 'recibo_sueldo')
      .attach('file', FAKE_IMAGE_PATH);

    expect(res.status).toBe(201);
    expect(res.body.document.type).toBe('recibo_sueldo');
  });

  test('rechaza un token de garante inválido', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('X-Guarantor-Token', '00000000-0000-0000-0000-000000000000')
      .field('type', 'recibo_sueldo')
      .attach('file', FAKE_IMAGE_PATH);

    expect(res.status).toBe(401);
  });

  test('rechaza sin ningún tipo de credencial', async () => {
    const res = await request(app)
      .post('/api/documents')
      .field('type', 'recibo_sueldo')
      .attach('file', FAKE_IMAGE_PATH);

    expect(res.status).toBe(401);
  });
});

describe('Seguridad de acceso a documentos', () => {
  test('un inquilino no puede ver el documento de otro inquilino', async () => {
    const userA = await createTestUser({ email: 'docA@test.com', role: 'inquilino' });
    await createTestProfile(userA.id);
    const tokenA = await loginAndGetToken('docA@test.com');

    const uploadRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${tokenA}`)
      .field('type', 'dni')
      .attach('file', FAKE_IMAGE_PATH);

    const userB = await createTestUser({ email: 'docB@test.com', role: 'inquilino' });
    await createTestProfile(userB.id);
    const tokenB = await loginAndGetToken('docB@test.com');

    const res = await request(app)
      .get(`/api/documents/${uploadRes.body.document.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });
});
