import api from './axiosClient';

export const categoryApi = {
  getAll: async () => {
    const res = await api.get('/categories');
    return res.data || [];
  },

  create: async (payload) => {
    const res = await api.post('/categories', payload);
    return res.data;
  },
};
