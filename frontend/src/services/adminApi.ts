import api from '@/lib/api';

export const adminApi = {
  // Dashboard Stats
  getStats: () => api.get('/admin/stats'),

  // Activity Feed
  getActivity: () => api.get('/admin/activity'),

  // Users
  getUsers: () => api.get('/admin/users'),
  getWhatsAppUsers: () => api.get('/admin/whatsapp-users'),
  updateUserStatus: (id: string, data: { status: string; plano?: string }) =>
    api.put(`/admin/users/${id}/status`, data),
  toggleUserAdmin: (id: string, is_admin: boolean) =>
    api.put(`/admin/users/${id}/admin`, { is_admin }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Templates
  getTemplates: () => api.get('/admin/templates'),
  updateTemplate: (id: string, data: { template_content?: string; template_name?: string; is_active?: boolean }) =>
    api.put(`/admin/templates/${id}`, data),
  getTemplatesUsage: () => api.get('/admin/templates-usage'),

  // WhatsApp Service
  getWhatsAppStatus: () => api.get('/admin/whatsapp-status'),
  clearTemplateCache: () => api.post('/admin/clear-template-cache'),

  // AI Config
  getAIConfig: () => api.get('/admin/ai-config'),
  updateAIConfig: (id: string, data: { config_value: string }) =>
    api.put(`/admin/ai-config/${id}`, data),

  // AI Usage
  getAIUsage: (period?: string) =>
    api.get('/admin/ai-usage', { params: { period } }),
};
