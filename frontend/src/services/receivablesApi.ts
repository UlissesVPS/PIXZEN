import api from '@/lib/api';

export const receivablesApi = {
  list: (status?: string) =>
    api.get('/receivables', { params: status ? { status } : undefined }),

  create: (data: {
    description: string;
    amount: number;
    expected_date: string;
    category_id: string;
    payer?: string;
    account_type?: string;
  }) => api.post('/receivables', data),

  update: (id: string, data: any) => api.put(`/receivables/${id}`, data),

  markAsReceived: (id: string) => api.put(`/receivables/${id}/receive`),

  delete: (id: string) => api.delete(`/receivables/${id}`),
};
