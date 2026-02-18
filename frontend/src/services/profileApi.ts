import api from '@/lib/api';

export const profileApi = {
  get: () => api.get('/profile'),

  update: (data: { nome: string }) => api.put('/profile', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
