# BÁO CÁO REVIEW CODE & TIẾN ĐỘ NÂNG CẤP — LexiconVocab (LearningEnglish)

| Thông tin | Giá trị |
|---|---|
| Ngày review | 21/11/2026 |
| Commit được review | `235f1ca` (+ 6 file đang sửa chưa commit) |
| Phạm vi | `server/` (Spring Boot 3.4.2, Java 21) và `client/` (React 19, Vite 8) |
| Mục tiêu | Ổn định nền tảng web trước khi phát triển ứng dụng iOS |

> **Lưu ý phạm vi:** Review tập trung vào bảo mật, xác thực, phân quyền dữ liệu, xử lý lỗi, gọi API, quản lý state và kết quả ESLint. Các file giao diện lớn chưa được đọc toàn bộ từng dòng.

---

## 1. Bảng theo dõi tiến độ

**Trạng thái:** ⬜ Chưa làm · 🔄 Đang làm · ✅ Hoàn thành · ⏸️ Tạm hoãn

| ID | Mức độ | Hạng mục | Trạng thái | Ngày hoàn thành | Ghi chú |
|---|---|---|---|---|---|
| SEC-01 | 🔴 Cao | Bỏ JWT secret mặc định khỏi source code | ⬜ | | |
| SEC-02 | 🔴 Cao | Giới hạn số lần nhập OTP và tần suất gửi OTP | ⬜ | | |
| FE-01 | 🔴 Cao | Sửa 16 lỗi gọi Hook có điều kiện (rules-of-hooks) | ⬜ | | |
| FE-02 | 🔴 Cao | Sửa 4 lỗi dùng hàm trước khi khai báo | ⬜ | | |
| BE-01 | 🔴 Cao | Chuẩn hóa xử lý lỗi (404 thay vì 500, không lộ lỗi nội bộ) | ⬜ | | |
| FE-03 | 🟡 TB | Tách `App.jsx` + dùng React Router | ⬜ | | |
| FE-04 | 🟡 TB | Tách data fetching ra custom hook / TanStack Query | ⬜ | | |
| FE-05 | 🟡 TB | Tách component lớn (`AddVocabModal`, `VocabCard`…) | ⬜ | | |
| FE-06 | 🟡 TB | Loại bỏ mockData và cờ `isBackendConnected` | ⬜ | | |
| FE-07 | 🟡 TB | Đưa thứ tự/tùy chọn hiển thị từ localStorage lên backend | ⬜ | | |
| BE-02 | 🟡 TB | Chuyển migration thủ công sang Flyway | ⬜ | | |
| BE-03 | 🟡 TB | Chuẩn hóa validate (`@Valid`, DTO cho reorder) | ⬜ | | |
| BE-04 | 🟡 TB | Tách cấu hình dev/prod (profile) | ⬜ | | |
| SEC-03 | 🟢 Thấp | Gộp cấu hình CORS, thêm domain production | ⬜ | | |
| SEC-04 | 🟢 Thấp | Refresh token (cần cho mobile) | ⬜ | | |
| SEC-05 | 🟢 Thấp | Chuyển mật khẩu/secret local sang biến môi trường | ⬜ | | |
| FE-08 | 🟢 Thấp | Xử lý 401 → chuyển về trang đăng nhập; đổi tên `axiosClient.js` | ⬜ | | |
| FE-09 | 🟢 Thấp | Xử lý 45 khối `catch` rỗng / nuốt lỗi | ⬜ | | |
| FE-10 | 🟢 Thấp | Dọn ESLint còn lại, gói `all`, file trùng, tên package | ⬜ | | |
| TEST-01 | 🟢 Thấp | Viết unit test cho `AuthService`, `VocabularyService` | ⬜ | | |

**Tổng quan:** 0 / 20 hoàn thành.

---

## 2. Điểm mạnh hiện tại

- **Phân quyền dữ liệu đúng:** mọi truy vấn đều lọc theo user (`findByIdAndUserId`), không đọc/sửa được dữ liệu của người khác.
- **Xác thực có nền tảng tốt:** BCrypt, JWT stateless, OTP sinh bằng `SecureRandom`, chuẩn hóa email, thông báo đăng nhập sai không tiết lộ email tồn tại.
- **Hiệu năng:** đã có cursor pagination, đã tránh N+1 trong `NoteListServiceImpl`, có index trên các bảng chính.
- **Cấu trúc:** backend theo lớp Controller → Service → Repository → Entity, có DTO và `ApiResponse<T>` thống nhất; frontend chia theo `features/`.
- `application.properties` đã được gitignore, lịch sử git không chứa mật khẩu thật.

---

## 3. Chi tiết lỗi ghi nhận

### 🔴 Mức độ cao — sửa trước khi deploy hoặc làm mobile

#### SEC-01 · JWT secret mặc định nằm trong source code
- **Vị trí:** `server/.../security/jwt/JwtProvider.java` dòng 23
- **Hiện trạng:** `@Value("${app.jwt.secret:404E6352...}")`. Chuỗi mặc định là ví dụ phổ biến trên các tutorial và đã được đẩy lên GitHub.
- **Rủi ro:** Nếu server chạy mà thiếu biến môi trường, bất kỳ ai cũng tự ký được token và đăng nhập vào mọi tài khoản.
- **Hướng sửa:**
  - Bỏ giá trị mặc định: `@Value("${app.jwt.secret}")` để ứng dụng không khởi động khi thiếu secret.
  - Kiểm tra độ dài secret ≥ 256 bit khi khởi động.
  - Tạo secret mới (`openssl rand -base64 64`) và đặt qua biến môi trường `APP_JWT_SECRET`.

#### SEC-02 · OTP không giới hạn số lần thử và tần suất gửi
- **Vị trí:** `server/.../service/impl/AuthServiceImpl.java` (`sendRegistrationOtp`, `verifyRegistrationOtp`, `register`); entity `OtpVerification`.
- **Rủi ro:**
  - Dò mã 6 chữ số không giới hạn trong 3 phút.
  - Gửi OTP liên tục tới email bất kỳ, dẫn tới spam qua Gmail của dự án và có thể bị Google khóa tài khoản SMTP.
- **Hướng sửa:**
  - Thêm cột `attempts` vào `OtpVerification`; sai quá 5 lần thì xóa OTP.
  - Chặn gửi lại trong 60 giây cho mỗi email (kiểm tra `createdAt` của OTP gần nhất).
  - Rate limit theo IP (Bucket4j hoặc filter đơn giản).
  - Lưu OTP dạng hash thay vì plain text (khuyến nghị).

#### FE-01 · Gọi React Hook có điều kiện (16 lỗi)
- **Vị trí:**
  - `features/vocabulary/components/VocabCard.jsx`: dòng 168, 222, 226, 231, 291, 304, 364, 377
  - `features/reading-lists/pages/ReadingListView.jsx`: dòng 598, 629, 641, 644
  - `features/categories/pages/CategoryView.jsx`: dòng 90, 140, 147
  - `features/vocabulary/components/RelatedVocabGroupModal.jsx`: dòng 44
- **Rủi ro:** Hook nằm sau `if (...) return`, nên khi dữ liệu thay đổi giữa các lần render, ứng dụng crash với lỗi *"Rendered more/fewer hooks than during the previous render"*.
- **Hướng sửa:** Đưa toàn bộ hook lên đầu component, trước mọi `return` sớm.

#### FE-02 · Dùng hàm trước khi khai báo (4 lỗi)
- **Vị trí:**
  - `AddVocabModal.jsx` dòng 1157 (`handleSubmit`)
  - `AddReadingListModal.jsx` dòng 112 (`handleSubmit`)
  - `AddNoteFolderModal.jsx` dòng 50 (`handleSubmit`)
  - `reading-lists/components/MoveFolderConfirmModal.jsx` dòng 168 (`handleExecuteConfirm`)
- **Rủi ro:** Effect (thường là phím tắt Enter/Esc) có thể giữ tham chiếu cũ hoặc gặp lỗi TDZ.
- **Hướng sửa:** Khai báo hàm (bằng `useCallback`) trước `useEffect` sử dụng nó.

#### BE-01 · Xử lý lỗi chưa chuẩn
- **Vị trí:** `config/GlobalExceptionHandler.java` dòng 42–45; 21 chỗ `new RuntimeException(...)` trong `VocabularyServiceImpl`, `NoteListServiceImpl`, `NoteFolderServiceImpl`, `CategoryServiceImpl`, `WordFamilyServiceImpl`.
- **Hiện trạng:**
  - Lỗi chung trả về `"Đã xảy ra lỗi máy chủ: " + ex.getMessage()`, có thể lộ câu SQL hoặc tên bảng.
  - "Không tìm thấy" ném `RuntimeException`, nên client nhận **500** thay vì **404**.
- **Hướng sửa:**
  - Tạo `ResourceNotFoundException` → 404, `ConflictException` → 409 (ví dụ trùng mã danh sách).
  - Handler chung chỉ trả thông báo chung, ghi chi tiết vào log (`log.error`).

---

### 🟡 Mức độ trung bình — nên làm trước khi phát triển mobile

#### FE-03 · `App.jsx` quá tải (~2.000 dòng, ~30 `useState`)
- Điều hướng bằng chuỗi `if (currentView === ...)` (dòng 505–566), không có URL thật, nút Back và refresh không hoạt động đúng.
- **Hướng sửa:** Dùng React Router (`/vocab`, `/lists/:id`, `/categories/:name`, `/profile`…); tách layout (Sidebar + Header) và state của modal về đúng trang sử dụng.

#### FE-04 · Logic gọi API nằm lẫn trong component
- **Hướng sửa:** Tách thành custom hook (`useVocabularies`, `useNoteLists`, `useCategories`…) hoặc dùng TanStack Query (cache, loading, refetch). Lớp này dùng lại được gần như nguyên vẹn cho React Native/Expo.

#### FE-05 · Component quá lớn
- `AddVocabModal.jsx` (~3.870 dòng, 29 `useState`), `ListVocabularyPage.jsx` (~1.990), `ReadingListView.jsx` (~1.490), `VocabCard.jsx` (~1.120).
- **Hướng sửa:** Tách `AddVocabModal` theo từng phần của form (FormsSection, SensesSection, ExamplesSection, CategoryPicker, WordFamilyPicker) và dùng `useReducer` cho state của form.

#### FE-06 · Trộn dữ liệu giả với dữ liệu thật
- State khởi tạo từ `data/mockData.js`; cờ `isBackendConnected` rẽ nhánh ở hơn 6 chỗ trong `App.jsx`.
- **Rủi ro:** người dùng thật có thể thấy dữ liệu giả khi backend lỗi.
- **Hướng sửa:** Bỏ mock khỏi luồng chính; khi backend lỗi thì hiển thị trạng thái lỗi hoặc thử lại.

#### FE-07 · Dữ liệu người dùng lưu ở localStorage
- `reading_list_custom_order`, `list_vocab_sort_by`, `list_vocab_modal_view_mode` (`ListVocabularyPage.jsx`).
- **Rủi ro:** web và app iPhone sẽ hiển thị thứ tự khác nhau.
- **Hướng sửa:** Dùng API `/note-lists/reorder` làm nguồn dữ liệu chính; tùy chọn hiển thị có thể lưu vào user settings trên backend.

#### BE-02 · Migration DB viết tay chạy mỗi lần khởi động
- `config/DatabaseConstraintMigration.java` (chưa commit) + `spring.jpa.hibernate.ddl-auto=update`.
- **Hướng sửa:** Dùng Flyway (`db/migration/V1__init.sql`, `V2__drop_uk_user_vocab.sql`…); production đặt `ddl-auto=validate`.

#### BE-03 · Validate không đồng đều
- `WordFamilyController` không dùng `@Valid`.
- `NoteListController` và `NoteFolderController` nhận `@RequestBody Object body` rồi tự `parseIds(...)`, trong khi `ReorderRequest` đã có sẵn nhưng chưa dùng.
- Mật khẩu được kiểm tra bằng regex trong `AuthServiceImpl.register` thay vì annotation trên DTO.
- **Hướng sửa:** Dùng `@Valid` + Bean Validation (`@Pattern`, `@Size`, `@NotEmpty`) cho mọi request.

#### BE-04 · Cấu hình chưa tách môi trường
- `show-sql=true`, `open-in-view=true`, `ddl-auto=update` dùng chung cho mọi môi trường.
- **Hướng sửa:** Tạo `application-dev.properties` và `application-prod.properties`; production tắt `show-sql` và `open-in-view`.

---

### 🟢 Mức độ thấp — cải thiện dần

| ID | Vấn đề | Hướng sửa |
|---|---|---|
| SEC-03 | CORS khai báo 2 nơi (`CorsConfig`, `SecurityConfig`), chỉ cho `localhost` | Giữ một nơi, đọc danh sách origin từ cấu hình |
| SEC-04 | Token hết hạn sau 24h, chưa có refresh token | Thêm refresh token (bắt buộc cho trải nghiệm mobile) |
| SEC-05 | Mật khẩu DB/Gmail và JWT secret ghi trực tiếp trong `application.properties` local | Dùng `${ENV_VAR}` cho mọi bí mật, tham khảo `.example` |
| FE-08 | `api/axiosClient.js` thực chất dùng `fetch`; gặp 401 chỉ xóa token | Đổi tên thành `httpClient.js`; khi 401 thì chuyển về trang đăng nhập |
| FE-09 | 45 khối `catch` rỗng hoặc nuốt lỗi | Ít nhất log lỗi hoặc hiển thị Toast |
| FE-10 | ESLint: 183 lỗi, 22 cảnh báo (71 `no-unused-vars`, 33 `no-empty`, 26 `set-state-in-effect`, 22 `exhaustive-deps`…); gói `"all"` thừa; `MoveFolderConfirmModal` trùng 2 nơi; tên package `vite-project` | Dọn dần, đặt mục tiêu ESLint 0 lỗi |
| TEST-01 | Chỉ có test mặc định `LearningEnglishApplicationTests` | Unit test cho `AuthServiceImpl`, `VocabularyServiceImpl`; integration test cho controller |

---

## 4. Lộ trình đề xuất

| Giai đoạn | Nội dung | Hạng mục |
|---|---|---|
| **1. Bảo mật & sửa lỗi** | Sửa các lỗi có thể gây mất an toàn hoặc crash | SEC-01, SEC-02, FE-01, FE-02, BE-01 |
| **2. Tái cấu trúc frontend** | Chuẩn bị code để dùng lại cho mobile | FE-03, FE-04, FE-05, FE-06, FE-07 |
| **3. Chuẩn hóa backend & deploy** | Sẵn sàng chạy trên server HTTPS công khai | BE-02, BE-03, BE-04, SEC-03, SEC-05 |
| **4. Chuẩn bị mobile** | Nền tảng cho app iOS | SEC-04, FE-08, giao diện responsive |
| **5. Chất lượng** | Làm song song các giai đoạn trên | FE-09, FE-10, TEST-01 |

---

## 5. Nhật ký thay đổi

| Ngày | Hạng mục | Mô tả thay đổi | Commit |
|---|---|---|---|
| 21/11/2026 | — | Tạo báo cáo review ban đầu | — |
