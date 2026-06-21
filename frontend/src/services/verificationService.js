import { api } from './api';

export const VerificationService = {
  async getQueue() {
    const { data } = await api.get('/verifications/queue');
    return data.queue;
  },

  async review(verificationId, { result, notes }) {
    const { data } = await api.post(`/verifications/${verificationId}/review`, { result, notes });
    return data.verification;
  },
};
