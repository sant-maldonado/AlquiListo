import { PropertyModel } from '../models/propertyModel.js';
import { SearchInterpreterService } from './searchInterpreterService.js';
import { SearchRankingService } from './searchRankingService.js';

const CANDIDATE_LIMIT = 30;
const RESULT_LIMIT = 15;

export const SearchOrchestratorService = {
  async search(naturalLanguageQuery) {
    let filters;
    try {
      filters = await SearchInterpreterService.parseQuery(naturalLanguageQuery);
    } catch (err) {
      console.error('Error en interpretación con IA, usando búsqueda sin filtros:', err.message);
      filters = { price_max: null, price_min: null, rooms_min: null, rooms_max: null, accepts_pets: null, neighborhood_hint: null, amenities: [], free_text_summary: '' };
    }

    const candidates = await PropertyModel.search({
      priceMax: filters.price_max,
      priceMin: filters.price_min,
      roomsMin: filters.rooms_min,
      roomsMax: filters.rooms_max,
      acceptsPets: filters.accepts_pets,
      neighborhoodHint: filters.neighborhood_hint,
      amenities: filters.amenities,
      limit: CANDIDATE_LIMIT,
    });

    if (candidates.length === 0) {
      return { filters, results: [] };
    }

    const amenitiesMap = await PropertyModel.getAmenitiesForMany(candidates.map((p) => p.id));
    const candidatesWithAmenities = candidates.map((p) => ({
      ...p,
      amenities: amenitiesMap.get(p.id) || [],
    }));

    let ranked;
    try {
      ranked = await SearchRankingService.rank({
        query: naturalLanguageQuery,
        properties: candidatesWithAmenities,
      });
    } catch (err) {
      console.error('Error en el ranking con IA, devolviendo sin ordenar:', err.message);
      ranked = candidatesWithAmenities.map((p) => ({ property_id: p.id, match_reason: null }));
    }

    const byId = new Map(candidatesWithAmenities.map((p) => [p.id, p]));
    const results = ranked
      .map((r) => {
        const property = byId.get(r.property_id);
        if (!property) return null;
        return { ...property, match_reason: r.match_reason };
      })
      .filter(Boolean)
      .slice(0, RESULT_LIMIT);

    return { filters, results };
  },
};
