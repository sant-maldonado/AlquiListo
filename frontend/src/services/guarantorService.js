import { api } from './api';

export const GuarantorService = {
  async list() {
    const { data } = await api.get('/guarantors');
    return data.guarantors;
  },

  async create({ type, full_name, dni, email, phone }) {
    const { data } = await api.post('/guarantors', { type, full_name, dni, email, phone });
    return data;
  },

  async remove(id) {
    await api.delete(`/guarantors/${id}`);
  },

  async resendInvite(id) {
    const { data } = await api.post(`/guarantors/${id}/invite`);
    return data;
  },

  async getByInviteToken(token) {
    const { data } = await api.get(`/guarantors/invite/${token}`);
    return data.guarantor;
  },
};
