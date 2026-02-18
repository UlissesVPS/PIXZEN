import api from '@/lib/api';

export const creditCardsApi = {
  list: () => api.get('/credit-cards'),

  create: (data: {
    name: string;
    last_digits: string;
    brand: string;
    card_limit: number;
    due_day: number;
    closing_day: number;
    color?: string;
    account_type?: string;
  }) => api.post('/credit-cards', data),

  update: (id: string, data: any) => api.put(`/credit-cards/${id}`, data),

  delete: (id: string) => api.delete(`/credit-cards/${id}`),
};
