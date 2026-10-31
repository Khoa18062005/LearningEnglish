/**
 * Service tích hợp Provinces Open API (Phiên bản v2)
 * Cấu trúc 2 cấp chuẩn sau sáp nhập hành chính: Tỉnh / Thành phố -> Phường / Xã / Thị trấn
 * Sử dụng native Fetch API của trình duyệt (không phụ thuộc external library)
 * Endpoint tài liệu: https://provinces.open-api.vn/api/v2/
 */
const PROVINCES_API_BASE = 'https://provinces.open-api.vn/api/v2';

let cachedProvinces = null;
const cachedWards = {};

export const locationApi = {
  /**
   * Lấy danh sách toàn bộ Tỉnh / Thành phố trực thuộc Trung ương
   * @returns {Promise<Array<{code: number, name: string, codename: string, division_type: string}>>}
   */
  getProvinces: async () => {
    if (cachedProvinces && cachedProvinces.length > 0) {
      return cachedProvinces;
    }
    try {
      const res = await fetch(`${PROVINCES_API_BASE}/p/`);
      if (!res.ok) {
        throw new Error(`Lỗi nạp danh sách Tỉnh/Thành: HTTP ${res.status}`);
      }
      const data = await res.json();
      cachedProvinces = data || [];
      return cachedProvinces;
    } catch (error) {
      console.error('Lỗi khi tải danh sách Tỉnh/Thành phố từ Provinces Open API v2:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách Phường / Xã / Thị trấn trực thuộc Tỉnh/Thành phố theo mã provinceCode
   * @param {number|string} provinceCode Mã tỉnh/thành
   * @returns {Promise<Array<{code: number, name: string, codename: string, division_type: string, province_code: number}>>}
   */
  getWardsByProvince: async (provinceCode) => {
    if (!provinceCode) return [];
    const key = String(provinceCode);
    if (cachedWards[key]) {
      return cachedWards[key];
    }
    try {
      const res = await fetch(`${PROVINCES_API_BASE}/p/${provinceCode}?depth=2`);
      if (!res.ok) {
        throw new Error(`Lỗi nạp danh sách Phường/Xã: HTTP ${res.status}`);
      }
      const data = await res.json();
      const wards = data?.wards || [];
      cachedWards[key] = wards;
      return wards;
    } catch (error) {
      console.error(`Lỗi khi tải danh sách Phường/Xã cho tỉnh ${provinceCode}:`, error);
      throw error;
    }
  },
};
