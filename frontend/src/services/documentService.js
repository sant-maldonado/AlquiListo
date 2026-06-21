import { api } from './api';

export const DocumentService = {
  async upload({ file, type, guarantorToken }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const headers = {};
    if (guarantorToken) {
      headers['X-Guarantor-Token'] = guarantorToken;
    }

    const { data } = await api.post('/documents', formData, { headers });
    return data.document;
  },

  async getOne(id) {
    const { data } = await api.get(`/documents/${id}`);
    return data.document;
  },

  async remove(id) {
    await api.delete(`/documents/${id}`);
  },

  async listForProfile(profileId) {
    const { data } = await api.get(`/profiles/${profileId}/documents`);
    return data.documents;
  },

  async pollUntilResolved(id, { intervalMs = 2000, maxAttempts = 15 } = {}) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const document = await this.getOne(id);
      if (document.ai_status !== 'pending' && document.ai_status !== 'processing') {
        return document;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return this.getOne(id);
  },
};
