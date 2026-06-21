import request from 'supertest';
import app from '../../src/server.js';
import {
  cleanDatabase,
  closeDatabase,
  createTestUser,
  createTestProperty,
} from '../helpers/db.js';

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

describe('POST /api/properties', () => {
  test('un propietario puede crear una propiedad', async () => {
    await createTestUser({ email: 'owner1@test.com', role: 'propietario' });
    const token = await loginAndGetToken('owner1@test.com');

    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Monoambiente en Pichincha',
        price: 180000,
        rooms: 1,
        address: 'Mendoza 2200',
        amenities: ['balcon', 'cochera'],
      });

    expect(res.status).toBe(201);
    expect(res.body.property.status).toBe('draft');
    expect(res.body.property.amenities.sort()).toEqual(['balcon', 'cochera'].sort());
  });

  test('un inquilino NO puede crear una propiedad', async () => {
    await createTestUser({ email: 'tenant1@test.com', role: 'inquilino' });
    const token = await loginAndGetToken('tenant1@test.com');

    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X', price: 1, rooms: 1, address: 'Y' });

    expect(res.status).toBe(403);
  });

  test('rechaza amenities inválidos', async () => {
    await createTestUser({ email: 'owner2@test.com', role: 'propietario' });
    const token = await loginAndGetToken('owner2@test.com');

    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X', price: 1, rooms: 1, address: 'Y', amenities: ['jacuzzi'] });

    expect(res.status).toBe(400);
  });

  test('rechaza si faltan campos requeridos', async () => {
    await createTestUser({ email: 'owner3@test.com', role: 'propietario' });
    const token = await loginAndGetToken('owner3@test.com');

    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Sin precio ni dirección' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/properties (listado público)', () => {
  test('solo devuelve propiedades publicadas', async () => {
    const owner = await createTestUser({ email: 'owner4@test.com', role: 'propietario' });
    await createTestProperty(owner.id, { title: 'Publicada', status: 'published' });
    await createTestProperty(owner.id, { title: 'Borrador', status: 'draft' });

    const res = await request(app).get('/api/properties');

    expect(res.status).toBe(200);
    expect(res.body.properties).toHaveLength(1);
    expect(res.body.properties[0].title).toBe('Publicada');
  });

  test('no requiere autenticación', async () => {
    const res = await request(app).get('/api/properties');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/properties/:id', () => {
  test('cualquiera puede ver una propiedad publicada', async () => {
    const owner = await createTestUser({ email: 'owner5@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'published' });

    const res = await request(app).get(`/api/properties/${property.id}`);

    expect(res.status).toBe(200);
    expect(res.body.property.id).toBe(property.id);
  });

  test('un anónimo NO puede ver una propiedad en borrador', async () => {
    const owner = await createTestUser({ email: 'owner6@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'draft' });

    const res = await request(app).get(`/api/properties/${property.id}`);

    expect(res.status).toBe(404);
  });

  test('el dueño SÍ puede ver su propia propiedad en borrador', async () => {
    const owner = await createTestUser({ email: 'owner7@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'draft' });
    const token = await loginAndGetToken('owner7@test.com');

    const res = await request(app)
      .get(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('otro propietario NO puede ver el borrador ajeno', async () => {
    const owner = await createTestUser({ email: 'owner8@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'draft' });

    await createTestUser({ email: 'owner9@test.com', role: 'propietario' });
    const otherToken = await loginAndGetToken('owner9@test.com');

    const res = await request(app)
      .get(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/properties/:id/status', () => {
  test('el dueño puede publicar su propiedad', async () => {
    const owner = await createTestUser({ email: 'owner10@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id, { status: 'draft' });
    const token = await loginAndGetToken('owner10@test.com');

    const res = await request(app)
      .patch(`/api/properties/${property.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' });

    expect(res.status).toBe(200);
    expect(res.body.property.status).toBe('published');
  });

  test('otro propietario no puede cambiar el estado de una propiedad ajena', async () => {
    const owner = await createTestUser({ email: 'owner11@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id);

    await createTestUser({ email: 'owner12@test.com', role: 'propietario' });
    const otherToken = await loginAndGetToken('owner12@test.com');

    const res = await request(app)
      .patch(`/api/properties/${property.id}/status`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ status: 'paused' });

    expect(res.status).toBe(403);
  });

  test('rechaza un status inválido', async () => {
    const owner = await createTestUser({ email: 'owner13@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id);
    const token = await loginAndGetToken('owner13@test.com');

    const res = await request(app)
      .patch(`/api/properties/${property.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'no_existe' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/properties/mine', () => {
  test('devuelve solo las propiedades del propietario logueado, incluyendo borradores', async () => {
    const owner = await createTestUser({ email: 'owner14@test.com', role: 'propietario' });
    await createTestProperty(owner.id, { title: 'Mía publicada', status: 'published' });
    await createTestProperty(owner.id, { title: 'Mía borrador', status: 'draft' });

    const otherOwner = await createTestUser({ email: 'owner15@test.com', role: 'propietario' });
    await createTestProperty(otherOwner.id, { title: 'Ajena' });

    const token = await loginAndGetToken('owner14@test.com');
    const res = await request(app)
      .get('/api/properties/mine')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.properties).toHaveLength(2);
    expect(res.body.properties.map((p) => p.title).sort()).toEqual(['Mía borrador', 'Mía publicada'].sort());
  });
});

describe('DELETE /api/properties/:id', () => {
  test('el dueño puede borrar su propiedad', async () => {
    const owner = await createTestUser({ email: 'owner16@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id);
    const token = await loginAndGetToken('owner16@test.com');

    const res = await request(app)
      .delete(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  test('un propietario no puede borrar una propiedad ajena', async () => {
    const owner = await createTestUser({ email: 'owner17@test.com', role: 'propietario' });
    const property = await createTestProperty(owner.id);

    await createTestUser({ email: 'owner18@test.com', role: 'propietario' });
    const otherToken = await loginAndGetToken('owner18@test.com');

    const res = await request(app)
      .delete(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});
