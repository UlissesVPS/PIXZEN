import api from '@/lib/api';

export const whatsappApi = {
  getStatus: () => api.get('/whatsapp/status'),

  link: (code: string) => api.post('/whatsapp/link', { code }),

  unlink: () => api.delete('/whatsapp/unlink'),
};
