import request from 'supertest';
import app from '../../src/server.js';
import { cleanDatabase, closeDatabase, createTestUser } from '../helpers/db.js';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('POST /api/auth/register', () => {
  test('registra un nuevo inquilino correctamente', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'nuevo@test.com',
      password: '12345678',
      role: 'inquilino',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('nuevo@test.com');
    expect(res.body.user.password_hash).toBeUndefined();
    expect(res.body.token).toBeDefined();
  });

  test('rechaza un registro con email duplicado', async () => {
    await createTestUser({ email: 'repetido@test.com' });

    const res = await request(app).post('/api/auth/register').send({
      email: 'repetido@test.com',
      password: '12345678',
      role: 'inquilino',
    });

    expect(res.status).toBe(409);
  });

  test('rechaza un rol inválido', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'x@test.com',
      password: '12345678',
      role: 'admin',
    });

    expect(res.status).toBe(400);
  });

  test('rechaza una contraseña demasiado corta', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'x@test.com',
      password: '123',
      role: 'inquilino',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('loguea correctamente con credenciales válidas', async () => {
    await createTestUser({ email: 'login@test.com', password: 'secreto123' });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com',
      password: 'secreto123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rechaza password incorrecto', async () => {
    await createTestUser({ email: 'login2@test.com', password: 'secreto123' });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login2@test.com',
      password: 'incorrecto',
    });

    expect(res.status).toBe(401);
  });

  test('rechaza un email que no existe', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.com',
      password: 'cualquiera',
    });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  test('rechaza sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('devuelve el usuario con un token válido', async () => {
    await createTestUser({ email: 'me@test.com', password: '12345678' });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'me@test.com',
      password: '12345678',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@test.com');
  });
});
