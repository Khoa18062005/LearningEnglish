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
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
      sessionStorage.removeItem('last_vocab_view');
      sessionStorage.removeItem('last_vocab_list_id');
      sessionStorage.removeItem('last_vocab_category');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Lỗi khi dọn dẹp storage khi logout:', e);
    }
  },
};
