import api from './axiosClient';

export const wordFamilyApi = {
  // Lấy danh sách word families kèm tìm kiếm theo keyword
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.keyword && params.keyword.trim()) {
      query.append('keyword', params.keyword.trim());
    }
    const queryString = query.toString();
    const endpoint = `/word-families${queryString ? `?${queryString}` : ''}`;
    const res = await api.get(endpoint);
    return res.data || [];
  },

  // Lấy chi tiết 1 word family
  getById: async (id) => {
    const res = await api.get(`/word-families/${id}`);
    return res.data;
  },

  // Tạo word family mới
  create: async (payload) => {
    const res = await api.post('/word-families', payload);
    return res.data;
  },

  // Cập nhật word family (từ đại diện rootWord, thứ tự thành viên)
  update: async (id, payload) => {
    const res = await api.put(`/word-families/${id}`, payload);
    return res.data;
  },

  // Xóa word family
  delete: async (id) => {
    const res = await api.delete(`/word-families/${id}`);
    return res.data;
  },
};
