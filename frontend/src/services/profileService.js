import { api } from './api';

export const ProfileService = {
  async getMyProfile() {
    const { data } = await api.get('/profiles/me');
    return data.profile;
  },

  async createMyProfile({ first_name, last_name, dni, monthly_income }) {
    const { data } = await api.post('/profiles/me', { first_name, last_name, dni, monthly_income });
    return data.profile;
  },

  async updateMyProfile(fields) {
    const { data } = await api.put('/profiles/me', fields);
    return data.profile;
  },

  async getMyScore() {
    const { data } = await api.get('/profiles/me/score');
    return data;
  },
};
