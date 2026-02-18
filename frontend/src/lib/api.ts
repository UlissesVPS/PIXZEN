import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pixzen-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect in demo mode - demo user has no real token
      const isDemoMode = localStorage.getItem('pixzen-demo-mode') === 'true';
      if (isDemoMode) {
        return Promise.reject(error);
      }
      localStorage.removeItem('pixzen-token');
      localStorage.removeItem('pixzen-user');
      // Don't redirect if already on auth page
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
