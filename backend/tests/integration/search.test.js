import request from 'supertest';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/services/searchInterpreterService.js', () => ({
  SearchInterpreterService: {
    parseQuery: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/services/searchRankingService.js', () => ({
  SearchRankingService: {
    rank: jest.fn(),
  },
}));

const { default: app } = await import('../../src/server.js');
const { cleanDatabase, closeDatabase, createTestUser, createTestProperty } = await import('../helpers/db.js');
const { SearchInterpreterService } = await import('../../src/services/searchInterpreterService.js');
const { SearchRankingService } = await import('../../src/services/searchRankingService.js');

beforeEach(async () => {
  await cleanDatabase();
  jest.clearAllMocks();
});

afterAll(async () => {
  await closeDatabase();
});

describe('POST /api/search', () => {
  test('rechaza una búsqueda vacía o muy corta', async () => {
    const res = await request(app).post('/api/search').send({ query: 'a' });
    expect(res.status).toBe(400);
  });

  test('no requiere autenticación', async () => {
    SearchInterpreterService.parseQuery.mockResolvedValue({
      price_max: null, price_min: null, rooms_min: null, rooms_max: null,
      accepts_pets: null, neighborhood_hint: null, amenities: [], free_text_summary: 'algo',
    });
    SearchRankingService.rank.mockResolvedValue([]);

    const res = await request(app).post('/api/search').send({ query: 'algo para alquilar' });
    expect(res.status).toBe(200);
  });

  test('devuelve resultados ordenados según el ranking simulado de la IA', async () => {
    const owner = await createTestUser({ email: 'owner@test.com', role: 'propietario' });
    const propertyA = await createTestProperty(owner.id, { title: 'Depto A', price: 200000, rooms: 2 });
    const propertyB = await createTestProperty(owner.id, { title: 'Depto B', price: 250000, rooms: 2 });

    SearchInterpreterService.parseQuery.mockResolvedValue({
      price_max: 300000, price_min: null, rooms_min: 2, rooms_max: 2,
      accepts_pets: null, neighborhood_hint: null, amenities: [], free_text_summary: '2 ambientes',
    });
    SearchRankingService.rank.mockResolvedValue([
      { property_id: propertyB.id, match_reason: 'Mejor encaja' },
      { property_id: propertyA.id, match_reason: 'Más económico' },
    ]);

    const res = await request(app).post('/api/search').send({ query: 'depto de 2 ambientes hasta 300mil' });

    expect(res.status).toBe(200);
    expect(res.body.results.map((r) => r.title)).toEqual(['Depto B', 'Depto A']);
  });

  test('si la interpretación de la IA falla, hace fallback a búsqueda sin filtros', async () => {
    SearchInterpreterService.parseQuery.mockRejectedValue(new Error('API caída'));

    const res = await request(app).post('/api/search').send({ query: 'algo para alquilar' });

    expect(res.status).toBe(200);
    expect(res.body.filters).toBeDefined();
  });
});
