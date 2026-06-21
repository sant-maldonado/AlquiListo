import { api } from './api';

export const ApplicationService = {
  async apply(propertyId) {
    const { data } = await api.post('/applications', { property_id: propertyId });
    return data.application;
  },

  async listMine() {
    const { data } = await api.get('/applications/mine');
    return data.applications;
  },

  async listForProperty(propertyId) {
    const { data } = await api.get(`/applications/property/${propertyId}`);
    return data.applications;
  },

  async accept(id) {
    const { data } = await api.post(`/applications/${id}/accept`);
    return data.application;
  },

  async listForOwner() {
    const { data } = await api.get('/applications/mine-as-owner');
    return data.applications;
  },

  async reject(id) {
    const { data } = await api.post(`/applications/${id}/reject`);
    return data.application;
  },
};
