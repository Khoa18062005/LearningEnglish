import api from './axiosClient';

export const categoryApi = {
  getAll: async () => {
    const res = await api.get('/categories');
    return res.data || [];
  },

  getById: async (id) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },

  create: async (payload) => {
    const res = await api.post('/categories', payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await api.put(`/categories/${id}`, payload);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};
