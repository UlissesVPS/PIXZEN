import api from '@/lib/api';

export const billsApi = {
  list: (status?: string) =>
    api.get('/bills', { params: status ? { status } : undefined }),

  create: (data: {
    description: string;
    amount: number;
    due_date: string;
    category_id: string;
    recurrence?: string;
    account_type?: string;
  }) => api.post('/bills', data),

  update: (id: string, data: any) => api.put(`/bills/${id}`, data),

  markAsPaid: (id: string) => api.put(`/bills/${id}/pay`),

  delete: (id: string) => api.delete(`/bills/${id}`),
};
