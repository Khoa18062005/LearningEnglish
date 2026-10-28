# KIẾN TRÚC CODEBASE CLIENT (REACT JS) - CHUẨN DOANH NGHIỆP
**Dự án:** Ứng dụng Học Từ Vựng & Tiếng Anh (Learning English)  
**Mô hình:** Decoupled Architecture (Frontend ReactJS tách biệt hoàn toàn với Backend Java Spring Boot)  
**Công nghệ:** ReactJS (Vite) + Tailwind CSS / UI System + Java Spring Boot REST API  

---

## 1. TỔNG QUAN KIẾN TRÚC (FEATURE-BASED ARCHITECTURE)

Dự án áp dụng mô hình **Feature-Based / Modular Architecture** (Kiến trúc theo tính năng nghiệp vụ - chuẩn Bulletproof React).
- Thay vì gom tất cả components vào một thư mục lớn, code được chia theo từng module nghiệp vụ (e.g., `auth`, `vocabulary`, `courses`, `quiz`, `reading-lists`).
- Mỗi module tự chứa: UI components, API calls, hooks, models, pages liên quan đến chính nó.
- Tách biệt rõ ràng giữa **Client State** (giao diện, theme, authentication) và **Server State** (dữ liệu học tập, danh sách từ vựng từ Spring Boot).
- Giao tiếp với Spring Boot qua giao thức HTTP REST API, hỗ trợ JWT Bearer Token, cơ chế Refresh Token và phân trang Pageable chuẩn.

---

## 2. CÂY THƯ MỤC CHI TIẾT CỦA `client/`

```text
client/
├── .env.development              # Biến môi trường local (URL trỏ tới Spring Boot localhost:8080)
├── .env.production               # Biến môi trường production (URL server thật)
├── .env.example                  # File mẫu để chia sẻ cho team (không chứa secret)
├── index.html                    # File HTML gốc của Vite
├── package.json                  # Dependencies & scripts riêng của client
├── vite.config.js                # Cấu hình Vite (Path alias '@/', Proxy sang Spring Boot)
├── tailwind.config.js            # Cấu hình Design System (màu sắc DOL Red & White, font chữ)
├── postcss.config.js
│
└── src/
    ├── assets/                   # Tài nguyên tĩnh được bundle (ảnh, logo, icons, audio)
    │   ├── images/
    │   └── icons/
    │
    ├── config/                   # Cấu hình chung của ứng dụng
    │   └── env.js                # Đọc biến môi trường an toàn (VITE_API_BASE_URL,...)
    │
    ├── api/                      # Tầng giao tiếp HTTP với Java Spring Boot
    │   ├── axiosClient.js        # Cấu hình Axios instance + Interceptors (Token, Error, Refresh Token)
    │   └── endpoints.js          # Khai báo tập trung toàn bộ URI API (/auth, /vocabularies, /reading-lists,...)
    │
    ├── components/               # Các UI components dùng chung (Dumb/Presentational Components)
    │   ├── common/               # Button, Input, Modal, Badge, Dropdown, Table, Loading...
    │   │   ├── Button/
    │   │   ├── Input/
    │   │   ├── Modal/
    │   │   ├── Table/
    │   │   └── Badge/
    │   ├── feedback/             # Toast thông báo, Alert, ErrorBoundary
    │   └── guard/                # Kiểm tra phân quyền truy cập
    │       ├── ProtectedRoute.jsx# Bắt buộc đăng nhập mới được vào
    │       └── RoleRoute.jsx     # Kiểm tra quyền: ADMIN, TEACHER hay STUDENT
    │
    ├── layouts/                  # Khung giao diện (Layout wrappers)
    │   ├── MainLayout.jsx        # Giao diện chính người học (Sidebar menu, Topbar, Content area)
    │   ├── AuthLayout.jsx        # Giao diện màn Login/Register
    │   └── AdminLayout.jsx       # Giao diện dành cho Quản trị viên
    │
    ├── features/                 # ⭐️ TRỌNG TÂM: Chia theo nghiệp vụ (Feature-based)
    │   │
    │   ├── auth/                 # Nghiệp vụ Xác thực & Tài khoản
    │   │   ├── api/authApi.js    # login, register, refreshToken, getCurrentUser
    │   │   ├── components/       # LoginForm.jsx, RegisterForm.jsx
    │   │   ├── hooks/useAuth.js  # Hook thao tác auth
    │   │   └── pages/            # LoginPage.jsx, RegisterPage.jsx
    │   │
    │   ├── vocabulary/           # Nghiệp vụ Quản lý & Học từ vựng (LinearVocab)
    │   │   ├── api/vocabApi.js   # getVocabularyMasterList, createVocab, updateVocab, deleteVocab
    │   │   ├── components/       # VocabTable.jsx, AddVocabModal.jsx, WordFamilyTag.jsx, PosBadge.jsx
    │   │   ├── hooks/useVocab.js # Hook quản lý filter, pagination, row grouping
    │   │   └── pages/            # VocabMasterListPage.jsx
    │   │
    │   ├── reading-lists/        # Nghiệp vụ Danh sách bài đọc (Reading Notes)
    │   │   ├── api/readingListApi.js # getReadingLists, getWordsInList, addWordToList
    │   │   ├── components/       # ReadingListSidebar.jsx, ReadingListCard.jsx
    │   │   └── pages/            # ReadingNoteFileViewPage.jsx
    │   │
    │   ├── courses/              # Nghiệp vụ Khóa học / Lộ trình học
    │   │   ├── api/courseApi.js
    │   │   ├── components/
    │   │   └── pages/
    │   │
    │   └── quiz/                 # Nghiệp vụ Bài kiểm tra / Luyện tập trắc nghiệm
    │       ├── api/quizApi.js
    │       ├── components/
    │       └── pages/
    │
    ├── routes/                   # Quản lý điều hướng (React Router)
    │   ├── index.jsx             # Cấu hình danh sách route tập trung (createBrowserRouter)
    │   └── paths.js              # Khai báo URL hằng số (PATHS.VOCAB, PATHS.READING_LIST,...)
    │
    ├── store/                    # Quản lý State toàn cục (Zustand)
    │   ├── useAuthStore.js       # Lưu thông tin user đang login, token, quyền
    │   └── useFilterStore.js     # Lưu trạng thái bộ lọc từ vựng, category, reading list
    │
    ├── hooks/                    # Custom Hooks tiện ích dùng chung
    │   ├── useDebounce.js        # Dùng khi gõ tìm kiếm từ vựng (tránh spam API)
    │   ├── useAudio.js           # Phát âm thanh phát âm từ vựng tiếng Anh
    │   └── usePagination.js      # Đồng bộ phân trang với Pageable của Spring Boot
    │
    ├── utils/                    # Các hàm tiện ích thuần JavaScript
    │   ├── formatters.js         # Format ngày tháng, điểm số, thời gian học
    │   └── storage.js            # Wrapper an toàn cho localStorage / sessionStorage
    │
    ├── constants/                # Hằng số hệ thống
    │   ├── roles.js              # USER_ROLES (ROLE_ADMIN, ROLE_STUDENT)
    │   ├── posColors.js          # Màu sắc của các từ loại: (n), (v), (adj), (adv)
    │   └── httpStatus.js         # HTTP Status Codes
    │
    ├── App.jsx                   # Component gốc gắn Router, QueryClientProvider, Toast
    ├── index.css                 # CSS toàn cục / Tailwind directives
    └── main.jsx                  # Điểm khởi động ứng dụng React
```

---

## 3. CÁC FILE CẤU HÌNH CỐT LÕI

### 3.1. `vite.config.js` (Hỗ trợ alias `@/` và Proxy sang Spring Boot)
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### 3.2. `src/api/axiosClient.js` (Giao tiếp bảo mật với Spring Boot)
```javascript
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Gắn JWT Bearer Token tự động
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Chuẩn hóa dữ liệu trả về từ Spring Boot (thường là ApiResponse<T>)
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const res = await axios.post('/api/v1/auth/refresh-token', { refreshToken });
        const { accessToken } = res.data.data;
        localStorage.setItem('access_token', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default axiosClient;
```

---

## 4. QUY TẮC PHÁT TRIỂN & CHUẨN DOANH NGHIỆP

1. **Nguyên tắc phân tầng dữ liệu:**
   - Dữ liệu từ Spring Boot API (Server State) được quản lý qua **React Query (@tanstack/react-query)** để tự động cache, revalidate và hỗ trợ phân trang `Page<T>` của Spring.
   - Dữ liệu giao diện (Client State) như đóng/mở sidebar, bộ lọc tìm kiếm được quản lý qua **Zustand** hoặc local state.

2. **Thiết kế giao diện (Design System):**
   - Theo phong cách chuẩn **DOL Red & White** đã quy định tại `TaiLieuHuongDan.md`:
     - Primary Red: `#E31E24` (Nút bấm chính, viền active, accent).
     - Secondary Soft Red: `#FEF2F2` (Nền badge, hover row).
     - Background: `#FFFFFF` (Nội dung) và `#F8FAFC` (Nền tổng thể & Sidebar).
     - Typography: `#1E293B` (Đen than đậm), `#64748B` (Xám trung tính).
     - Semantic Badges: `(n)` Xanh dương, `(v)` Đỏ đô, `(adj)` Xanh lá, `(adv)` Tím.
