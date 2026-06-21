import { api } from './api';

export const AuthService = {
  async register({ email, password, role }) {
    const { data } = await api.post('/auth/register', { email, password, role });
    return data;
  },

  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
