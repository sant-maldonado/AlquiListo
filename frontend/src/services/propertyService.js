import { api } from './api';

export const PropertyService = {
  async listPublished({ limit = 20, offset = 0 } = {}) {
    const { data } = await api.get('/properties', { params: { limit, offset } });
    return data;
  },

  async getOne(id) {
    const { data } = await api.get(`/properties/${id}`);
    return data.property;
  },

  async listMine() {
    const { data } = await api.get('/properties/mine');
    return data.properties;
  },

  async create(fields) {
    const { data } = await api.post('/properties', fields);
    return data.property;
  },

  async update(id, fields) {
    const { data } = await api.put(`/properties/${id}`, fields);
    return data.property;
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/properties/${id}/status`, { status });
    return data.property;
  },

  async remove(id) {
    await api.delete(`/properties/${id}`);
  },

  async uploadPhotos(id, files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('photos', file);
    }
    const { data } = await api.post(`/properties/${id}/photos`, formData);
    return data.photos;
  },

  async removePhoto(propertyId, photoId) {
    await api.delete(`/properties/${propertyId}/photos/${photoId}`);
  },
};
