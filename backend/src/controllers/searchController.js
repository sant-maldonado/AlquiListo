import { SearchOrchestratorService } from '../services/searchOrchestratorService.js';

export const SearchController = {
  async search(req, res) {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length < 3) {
        return res.status(400).json({ error: 'Escribí qué estás buscando (mínimo 3 caracteres)' });
      }

      const { filters, results } = await SearchOrchestratorService.search(query.trim());

      return res.json({ query, filters, results, count: results.length });
    } catch (err) {
      console.error('Error en search:', err);
      return res.status(500).json({ error: 'No pudimos procesar tu búsqueda. Probá de nuevo.' });
    }
  },
};
