import api from './axiosClient';

export const noteFolderApi = {
  getAll: async () => {
    const res = await api.get('/note-folders');
    return res.data || [];
  },

  getById: async (id) => {
    const res = await api.get(`/note-folders/${id}`);
    return res.data;
  },

  create: async (payload) => {
    const res = await api.post('/note-folders', payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await api.put(`/note-folders/${id}`, payload);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/note-folders/${id}`);
    return res.data;
  },
};
