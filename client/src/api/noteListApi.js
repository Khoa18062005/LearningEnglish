import api from './axiosClient';

export const noteListApi = {
  getAll: async () => {
    const res = await api.get('/note-lists');
    return res.data || [];
  },

  getById: async (id) => {
    const res = await api.get(`/note-lists/${id}`);
    return res.data;
  },

  create: async (payload) => {
    const res = await api.post('/note-lists', payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await api.put(`/note-lists/${id}`, payload);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/note-lists/${id}`);
    return res.data;
  },
};
