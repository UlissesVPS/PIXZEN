import api from '@/lib/api';

export const authApi = {
  signUp: (email: string, password: string, name: string) =>
    api.post('/auth/signup', { email, password, name }),

  signIn: (email: string, password: string) =>
    api.post('/auth/signin', { email, password }),

  getMe: () => api.get('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};
