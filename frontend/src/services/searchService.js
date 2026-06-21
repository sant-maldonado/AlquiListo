import { api } from './api';

export const SearchService = {
  async search(query) {
    const { data } = await api.post('/search', { query });
    return data;
  },
};
