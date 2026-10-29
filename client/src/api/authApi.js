import api from './axiosClient';

export const authApi = {
  register: async (payload) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
  },
};
