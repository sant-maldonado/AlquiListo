import { jest } from '@jest/globals';

const mockSearch = jest.fn();
const mockGetAmenitiesForMany = jest.fn();
jest.unstable_mockModule('../../src/models/propertyModel.js', () => ({
  PropertyModel: { search: mockSearch, getAmenitiesForMany: mockGetAmenitiesForMany },
}));

const mockParseQuery = jest.fn();
jest.unstable_mockModule('../../src/services/searchInterpreterService.js', () => ({
  SearchInterpreterService: { parseQuery: mockParseQuery },
}));

const mockRank = jest.fn();
jest.unstable_mockModule('../../src/services/searchRankingService.js', () => ({
  SearchRankingService: { rank: mockRank },
}));

const { SearchOrchestratorService } = await import('../../src/services/searchOrchestratorService.js');

describe('SearchOrchestratorService.search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParseQuery.mockResolvedValue({
      price_max: 300000,
      price_min: null,
      rooms_min: 2,
      rooms_max: 2,
      accepts_pets: true,
      neighborhood_hint: 'centro',
      amenities: [],
      free_text_summary: 'depto de 2 ambientes en el centro',
    });
    mockGetAmenitiesForMany.mockResolvedValue(new Map());
  });

  test('si no hay candidatas, devuelve resultados vacíos sin llamar al ranking', async () => {
    mockSearch.mockResolvedValue([]);

    const { results } = await SearchOrchestratorService.search('depto de 2 ambientes en el centro hasta 300mil');

    expect(results).toEqual([]);
    expect(mockRank).not.toHaveBeenCalled();
  });

  test('ordena los resultados según lo que devuelve el ranking de la IA', async () => {
    mockSearch.mockResolvedValue([
      { id: 'p1', title: 'Depto A' },
      { id: 'p2', title: 'Depto B' },
    ]);
    mockRank.mockResolvedValue([
      { property_id: 'p2', match_reason: 'Mejor ubicado' },
      { property_id: 'p1', match_reason: 'Más barato' },
    ]);

    const { results } = await SearchOrchestratorService.search('algo');

    expect(results.map((r) => r.id)).toEqual(['p2', 'p1']);
    expect(results[0].match_reason).toBe('Mejor ubicado');
  });

  test('si la IA de ranking falla, devuelve las candidatas igual (sin ordenar)', async () => {
    mockSearch.mockResolvedValue([{ id: 'p1', title: 'Depto A' }]);
    mockRank.mockRejectedValue(new Error('timeout'));

    const { results } = await SearchOrchestratorService.search('algo');

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('p1');
    expect(results[0].match_reason).toBeNull();
  });

  test('ignora ids inventados por la IA que no estaban en las candidatas', async () => {
    mockSearch.mockResolvedValue([{ id: 'p1', title: 'Depto A' }]);
    mockRank.mockResolvedValue([
      { property_id: 'p1', match_reason: 'Encaja bien' },
      { property_id: 'no-existe', match_reason: 'inventado' },
    ]);

    const { results } = await SearchOrchestratorService.search('algo');

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('p1');
  });

  test('pasa los filtros interpretados correctamente al modelo', async () => {
    mockSearch.mockResolvedValue([]);

    await SearchOrchestratorService.search('depto de 2 ambientes en el centro hasta 300mil con mascotas');

    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        priceMax: 300000,
        roomsMin: 2,
        roomsMax: 2,
        acceptsPets: true,
        neighborhoodHint: 'centro',
      })
    );
  });
});
