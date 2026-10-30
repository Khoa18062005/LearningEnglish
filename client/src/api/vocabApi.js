import api from './axiosClient';

export const vocabApi = {
  // Lấy danh sách từ vựng kèm Cursor-based pagination
  getByCursor: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.cursor) query.append('cursor', params.cursor);
    if (params.limit) query.append('limit', params.limit);
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.categoryName && params.categoryName !== 'all') query.append('categoryName', params.categoryName);
    if (params.noteListId) query.append('noteListId', params.noteListId);
    if (params.pos && params.pos !== 'all') query.append('pos', params.pos);
    if (params.wordFamilyId) query.append('wordFamilyId', params.wordFamilyId);

    const queryString = query.toString();
    const endpoint = `/vocabularies/cursor${queryString ? `?${queryString}` : ''}`;
    const res = await api.get(endpoint);
    return res.data || { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
  },

  // Lấy toàn bộ danh sách từ vựng (cho fallback hoặc tính toán nhanh)
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.categoryName && params.categoryName !== 'all') query.append('categoryName', params.categoryName);
    if (params.noteListId) query.append('noteListId', params.noteListId);
    if (params.pos && params.pos !== 'all') query.append('pos', params.pos);
    if (params.wordFamilyId) query.append('wordFamilyId', params.wordFamilyId);

    const queryString = query.toString();
    const endpoint = `/vocabularies${queryString ? `?${queryString}` : ''}`;
    const res = await api.get(endpoint);
    return res.data || [];
  },

  // Lấy chi tiết 1 từ vựng
  getById: async (id) => {
    const res = await api.get(`/vocabularies/${id}`);
    return res.data;
  },

  // Tạo từ vựng mới
  create: async (payload) => {
    const res = await api.post('/vocabularies', payload);
    return res.data;
  },

  // Cập nhật từ vựng
  update: async (id, payload) => {
    const res = await api.put(`/vocabularies/${id}`, payload);
    return res.data;
  },

  // Xóa từ vựng
  delete: async (id) => {
    const res = await api.delete(`/vocabularies/${id}`);
    return res.data;
  },
};
