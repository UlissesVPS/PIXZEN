import api from '@/lib/api';

export const subscriptionApi = {
  getStatus: () => api.get('/subscription/status'),

  activate: () => api.put('/subscription/activate'),
};
