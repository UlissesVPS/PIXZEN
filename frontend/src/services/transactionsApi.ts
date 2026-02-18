import api from '@/lib/api';

export const transactionsApi = {
  list: (params?: { account_type?: string; type?: string; start_date?: string; end_date?: string }) =>
    api.get('/transactions', { params }),

  create: (data: {
    description: string;
    amount: number;
    type: string;
    category_id: string;
    date?: string;
    account_type?: string;
    payment_method?: string;
    card_id?: string;
    installments?: number;
    current_installment?: number;
    installment_group_id?: string;
  }) => api.post('/transactions', data),

  update: (id: string, data: {
    description?: string;
    amount?: number;
    type?: string;
    category_id?: string;
    date?: string;
    account_type?: string;
    payment_method?: string;
    card_id?: string;
  }) => api.put(`/transactions/${id}`, data),

  delete: (id: string) => api.delete(`/transactions/${id}`),

  getSummary: (account_type?: string) =>
    api.get('/transactions/summary', { params: { account_type } }),
};
