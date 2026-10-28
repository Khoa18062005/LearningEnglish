# TÀI LIỆU ĐẶC TẢ KỸ THUẬT & THIẾT KẾ HỆ THỐNG HỌC TỪ VỰNG TIẾNG ANH
**Tech Stack:** ReactJS (Frontend) | Java Spring Boot (Backend) | MySQL (Database) | Google Stitch (UI/UX Generation)

---

## PHẦN 1: PHONG CÁCH THIẾT KẾ (DESIGN SYSTEM) - "DOL RED & WHITE"
Để Google Stitch và quá trình code ReactJS (TailwindCSS) đồng bộ với Hình 1 (DOL English), dưới đây là bảng thông số chuẩn:

*   **Bảng màu (Color Palette):**
    *   **Primary Red (Màu nhấn chính):** `#E31E24` hoặc `#D92D20` (Dùng cho nút bấm chính, logo, tab đang active, viền nổi bật).
    *   **Secondary Soft Red (Nền phụ):** `#FEF2F2` hoặc `#FEE2E2` (Dùng cho nền của badge, hiệu ứng hover dòng trong bảng, thẻ tag danh mục).
    *   **Background (Nền chính):** `#FFFFFF` (Trắng tinh khiết cho vùng nội dung) và `#F8FAFC` (Xám cực nhạt cho nền tổng thể/Sidebar để tạo độ sâu).
    *   **Typography (Màu chữ):** `#1E293B` (Đen than đậm cho từ vựng chính và tiêu đề - giống màu chữ *"Học viện Tiếng Anh Tư Duy"*), `#64748B` (Xám trung tính cho ví dụ và ghi chú).
    *   **Semantic Badges (Màu từ loại):**
        *   Danh từ `(n)`: Xanh dương đậm `#1D4ED8` / Nền `#DBEAFE`
        *   Động từ `(v)`: Đỏ đô `#B91C1C` / Nền `#FEE2E2`
        *   Tính từ `(adj)`: Xanh lá `#15803D` / Nền `#DCFCE7`
        *   Trạng từ `(adv)`: Tím `#6D28D9` / Nền `#EDE9FE`
*   **Font chữ & Hình khối:**
    *   Font: `Inter`, `Plus Jakarta Sans` hoặc `SF Pro Display`.
    *   Bo góc (Border Radius): `12px` (`rounded-xl`) cho các thẻ Card/Modal, `8px` (`rounded-lg`) cho nút bấm và ô input.
    *   Đổ bóng (Shadow): Bóng mờ nhẹ tinh tế (`0 4px 20px -2px rgba(0, 0, 0, 0.05)`).

---

## PHẦN 2: LỆNH PROMPT CHO GOOGLE STITCH (UI GENERATION PROMPTS)
> **Hướng dẫn sử dụng:** Google Stitch hoạt động tốt nhất và chính xác nhất với **Tiếng Anh chuyên ngành UI/UX**. Bạn hãy copy từng đoạn mã trong khung bên dưới và dán trực tiếp vào Google Stitch.

### Prompt 1: Giao diện Màn hình chính (Dashboard & Bảng Từ Vựng Đa Tầng)
*(Copy đoạn dưới đây vào Google Stitch để tạo màn hình chính giống sự kết hợp giữa Hình 1 và Hình 2)*

```text
Design a modern, clean desktop web application for an English Vocabulary Learning Management System inspired by an EdTech aesthetic. 

STYLE & COLOR PALETTE:
- Primary Theme: Clean Pure White (#FFFFFF) and Light Slate (#F8FAFC) backgrounds with Vibrant Crimson Red (#E31E24) as the primary brand accent, paired with Deep Charcoal (#1E293B) typography.
- Modern rounded corners (12px), subtle card shadows, clean sans-serif typography (Plus Jakarta Sans / Inter).

LAYOUT STRUCTURE:
1. Left Sidebar (260px width, white background, right border):
   - Brand header at the top with a bold red icon and text "LinearVocab".
   - Navigation section "VIEWS": "All Vocabulary (Master List)", "Word Families".
   - Navigation section "READING LISTS (NOTE FILES)" with a "+" button: List items showing folder icons like "LIST 01 - Reading Cam 18", "LIST 02 - Business Article" with word count badges.
   - Navigation section "CATEGORIES" with a "+" button: Multi-select tag filters like "Từ vựng chỉ người (People)", "Từ vựng văn phòng (Office)", "Finance".

2. Top Header & Filter Bar:
   - Prominent Search Bar with a magnifying glass icon: "Search vocabulary, patterns, collocations, or Vietnamese meanings..."
   - Filter Pills next to search: Part of Speech filter pills ("All", "Noun (n)", "Verb (v)", "Adj", "Adv"), Category dropdown, and Word Family toggle.
   - Primary CTA Button on the far right: Solid Red (#E31E24) button with white text "+ Thêm Từ Mới (Add Vocab)".

3. Main Content Area - Multi-layered Vocabulary Data Table (Crucial):
   - A structured, modern spreadsheet-like table with row-spanning capabilities (grouped rows for a single vocabulary word that has multiple forms or meanings).
   - Columns: 
     1. Vocab & Tags (Shows the main word in bold charcoal e.g., "lease" or "accountant", countable/uncountable badge [C]/[U], and small category pills underneath like "Từ chỉ người", "Văn phòng").
     2. Form (Part of speech badges: "(v)", "(n)" with distinct soft colored pills).
     3. Pattern (Grammar structures like "+ sth from sb", "+ sb sth").
     4. Collocation (e.g., "lease agreement").
     5. Synonym (e.g., "rental", "lobby").
     6. Meaning (Vietnamese meaning in clear medium-weight text, e.g., "thuê, mướn từ ai đó", "hợp đồng thuê mướn").
     7. Example & Notes (Italicized English example sentence with a subtle note icon).
   - Demonstrate complex row grouping in the UI: Show the word "lease" spanning 3 sub-rows (2 sub-rows for Verb with different patterns/meanings, and 1 sub-row for Noun with a collocation and meaning). Show "accountant (n) [C]" with category badges "Từ vựng chỉ người" and "Từ vựng văn phòng".
```

---

### Prompt 2: Giao diện Modal/Drawer Thêm Từ Vựng Mới (Dynamic Form Table)
*(Copy đoạn dưới đây vào Google Stitch để tạo giao diện bật lên khi bấm nút Thêm Từ Mới)*

```text
Design a wide, modern Modal Dialog or Slide-over Drawer UI (1000px width) for "Add / Edit Complex Vocabulary" in an EdTech web app, using a White and Crimson Red (#E31E24) color scheme.

HEADER:
- Title: "Thêm Từ Vựng Mới (Add New Vocabulary)" in bold Deep Charcoal (#1E293B).
- Subtitle: "Add word forms, patterns, collocations, and assign to reading lists or categories."

SECTION 1: CORE WORD & ORGANIZATION (Top Grid - 3 Columns):
- Input 1: "Vocabulary (Từ vựng)" - Large text input (e.g., filled with "accountant" or "lease").
- Input 2: "Word Family (Gia đình từ)" - Tag input showing related words (e.g., "account (n)", "accounting (n)", "accountable (adj)").
- Input 3: "Reading Note List (Thẻ List bài đọc)" - Dropdown/Combobox to select or create a reading file (e.g., "LIST 01 - IELTS Reading Pass 1").
- Input 4 (Full width): "Categories (Danh mục - Chọn nhiều)" - Multi-select tag input with active red-tinted pills: "Từ vựng chỉ người x", "Từ vựng văn phòng x", plus a "+ Tạo danh mục mới" button.

SECTION 2: WORD FORMS & SENSES BUILDER (Dynamic Nested Table/Cards):
- A tabbed or stacked card section allowing multiple Parts of Speech for this word.
- Card 1 Header: Part of Speech Selector set to "Verb (Động từ)" or "Noun (Danh từ)". Next to it, if Noun is selected, show a segmented toggle for Countability: "[C] Đếm được", "[U] Không đếm được", "[C/U] Cả hai".
- Inside the Card, display an interactive, clean Table for Meanings, Patterns & Collocations (allowing 1-to-many entries):
  - Table Columns: 
    1. Pattern (Input cell, e.g., "+ sth from sb")
    2. Collocation (Input cell, e.g., "lease agreement")
    3. Synonym (Input cell, e.g., "hire, rent")
    4. Nghĩa Tiếng Việt (Required input cell, e.g., "thuê, mướn (ngắn hạn)")
    5. Ví dụ & Ghi chú (Expandable input cell for example sentences and usage notes)
    6. Action (Delete row icon)
  - Below the table: A dashed red button "+ Thêm nghĩa / Pattern / Collocation mới (Add Meaning Row)".
- Below Card 1: A secondary button "+ Thêm Từ Loại Khác (Add Another Word Form - e.g., Noun/Verb)".

FOOTER:
- Cancel button (Ghost style) and "Lưu Từ Vựng (Save Vocabulary)" button in solid Crimson Red (#E31E24).
```

---

### Prompt 3: Giao diện Xem Chi Tiết Thẻ List (Reading Note File View)
*(Dùng khi bạn muốn thiết kế riêng màn hình quản lý từ vựng sau 1 bài Reading dài)*

```text
Design a "Reading Note File Detail View" screen for an English learning web app (White and Red #E31E24 theme).
- Top Banner Card: White card with a thin red left border accent. Shows Folder Badge "READING NOTE FILE", Title "LIST 01: Cambridge 18 - Test 1 - Passage 2", Date created, Total words badge (24 words), and an button "Quick Add Word to this List".
- Main Area: A split view or toggleable view between "Spreadsheet Table Mode" (showing Vocab, Form, Pattern, Collocation, Synonym, Meaning, Example) and "Flashcard Review Mode".
- Include a quick inline-add row at the very bottom of the table so the user can rapidly type a new word, its form, pattern, and Vietnamese meaning right after finishing a reading passage, which automatically syncs to the Master Vocabulary List.
```

---

## PHẦN 3: THIẾT Kế CƠ SỞ DỮ LIỆU (MYSQL SCHEMA)
Điểm cốt lõi và phức tạp nhất trong yêu cầu của bạn là **mối quan hệ đa tầng của một từ vựng** (như từ `rent` hoặc `lease` trong Hình 2):
*   1 Từ vựng (`vocab`) $\rightarrow$ Có thể thuộc nhiều `Danh mục` (Categories) và nhiều `Thẻ List bài đọc` (Note Lists), đồng thời nằm trong 1 nhóm `Word Family`.
*   1 Từ vựng $\rightarrow$ Có 1 hoặc nhiều `Từ loại` (`Word Form`: `n`, `v`, `adj`, `adv`). Nếu là `n` (Danh từ) thì có thêm thuộc tính `Đếm được / Không đếm được` (`COUNTABLE`, `UNCOUNTABLE`, `BOTH`).
*   Ứng với mỗi `Từ loại` $\rightarrow$ Có 1 hoặc nhiều `Đơn vị nghĩa / Cách dùng` (`Vocab Sense`). Mỗi dòng nghĩa này sẽ chứa cặp `Pattern` + `Nghĩa tương ứng`, hoặc `Collocation` + `Nghĩa tương ứng`, kèm theo `Synonym`, nhiều `Ví dụ` và `Ghi chú`.

Dưới đây là mã SQL chuẩn hóa (3NF) cho **MySQL 8.0+**:

```sql
CREATE DATABASE IF NOT EXISTS dol_vocab_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dol_vocab_db;

-- 1. Bảng Nhóm Gia Đình Từ (Word Family)
CREATE TABLE word_families (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    root_word VARCHAR(100) NOT NULL COMMENT 'Từ gốc đại diện, VD: account, employ',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Từ Vựng Gốc (Master Vocabulary - Ghi chú tổng)
CREATE TABLE vocabularies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(150) NOT NULL UNIQUE COMMENT 'Từ vựng tiếng Anh, VD: accountant, lease, rent',
    meaning TEXT COMMENT 'Nét nghĩa tiếng Việt cơ bản chung của từ vựng / cụm từ',
    phonetic VARCHAR(100) COMMENT 'Phiên âm IPA: /əˈkaʊntənt/',
    audio_url VARCHAR(500),
    word_family_id BIGINT NULL,
    general_note TEXT COMMENT 'Ghi chú chung cho cả từ vựng này',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vocab_family FOREIGN KEY (word_family_id) REFERENCES word_families(id) ON DELETE SET NULL,
    INDEX idx_vocab_word (word)
);

-- 3. Bảng Danh Mục (Categories - VD: Từ vựng chỉ người, Từ vựng văn phòng)
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    color_code VARCHAR(20) DEFAULT '#E31E24',
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng trung gian: Từ vựng <-> Danh mục (Quan hệ N-N)
CREATE TABLE vocab_categories (
    vocab_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (vocab_id, category_id),
    CONSTRAINT fk_vc_vocab FOREIGN KEY (vocab_id) REFERENCES vocabularies(id) ON DELETE CASCADE,
    CONSTRAINT fk_vc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 5. Bảng Thẻ List / File Ghi Chú Bài Đọc (Reading Note Lists - VD: LIST 01)
CREATE TABLE note_lists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT 'Tên thẻ list, VD: LIST 01 - Reading Passage 1',
    source_reference VARCHAR(255) COMMENT 'Nguồn bài đọc/sách',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng trung gian: Thẻ List <-> Từ vựng (Quan hệ N-N, lưu vào list nhưng vẫn nằm ở bảng tổng)
CREATE TABLE note_list_vocabs (
    note_list_id BIGINT NOT NULL,
    vocab_id BIGINT NOT NULL,
    context_note VARCHAR(500) COMMENT 'Ghi chú ngữ cảnh riêng lúc gặp từ này trong bài Reading đó',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_list_id, vocab_id),
    CONSTRAINT fk_nlv_list FOREIGN KEY (note_list_id) REFERENCES note_lists(id) ON DELETE CASCADE,
    CONSTRAINT fk_nlv_vocab FOREIGN KEY (vocab_id) REFERENCES vocabularies(id) ON DELETE CASCADE
);

-- 7. Bảng Từ Loại của Từ Vựng (Word Forms - 1 từ có thể vừa là N vừa là V)
CREATE TABLE vocab_forms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vocab_id BIGINT NOT NULL,
    part_of_speech ENUM('N', 'V', 'ADJ', 'ADV', 'PHRASAL_VERB', 'IDIOM', 'PREP') NOT NULL COMMENT 'Từ loại',
    countability ENUM('COUNTABLE', 'UNCOUNTABLE', 'BOTH', 'NOT_APPLICABLE') DEFAULT 'NOT_APPLICABLE' COMMENT 'Chỉ áp dụng cho Danh từ (N)',
    display_order INT DEFAULT 1,
    CONSTRAINT fk_vf_vocab FOREIGN KEY (vocab_id) REFERENCES vocabularies(id) ON DELETE CASCADE,
    INDEX idx_pos (part_of_speech)
);

-- 8. Bảng Chi Tiết Nghĩa, Pattern, Collocation (Vocab Senses / Usages)
-- Giải quyết bài toán Hình 2: Mỗi dòng dưới 1 từ loại có thể mang Pattern riêng, Collocation riêng, Synonym riêng và Nghĩa riêng
CREATE TABLE vocab_senses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vocab_form_id BIGINT NOT NULL,
    pattern VARCHAR(255) NULL COMMENT 'VD: + sth from sb, + sb sth',
    collocation VARCHAR(255) NULL COMMENT 'VD: lease agreement (Mỗi collocation đi kèm nghĩa cụ thể ở cột vietnamese_meaning)',
    synonyms VARCHAR(255) NULL COMMENT 'Các từ đồng nghĩa cho nét nghĩa này, VD: rental, lobby',
    vietnamese_meaning VARCHAR(500) NOT NULL COMMENT 'Nghĩa tiếng Việt ứng với pattern/collocation/từ loại này',
    usage_note TEXT NULL COMMENT 'Ghi chú riêng cho nét nghĩa này',
    display_order INT DEFAULT 1,
    CONSTRAINT fk_vs_form FOREIGN KEY (vocab_form_id) REFERENCES vocab_forms(id) ON DELETE CASCADE
);

-- 9. Bảng Ví Dụ (Examples - 1 nét nghĩa có thể có nhiều hơn 1 câu ví dụ)
CREATE TABLE vocab_examples (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vocab_sense_id BIGINT NOT NULL,
    example_sentence TEXT NOT NULL COMMENT 'Câu ví dụ tiếng Anh',
    example_translation TEXT NULL COMMENT 'Dịch nghĩa câu ví dụ (nếu cần)',
    CONSTRAINT fk_ve_sense FOREIGN KEY (vocab_sense_id) REFERENCES vocab_senses(id) ON DELETE CASCADE
);
```

### Minh họa cách dữ liệu của bạn được lưu vào DB trên:
*   **Trường hợp 1: Từ `accountant`**
    *   `vocabularies`: `word = "accountant"`
    *   `vocab_categories`: Liên kết tới 2 dòng trong bảng `categories` là `"Từ vựng chỉ người"` và `"Từ vựng văn phòng"`.
    *   `vocab_forms`: 1 dòng với `part_of_speech = 'N'`, `countability = 'COUNTABLE'`.
    *   `vocab_senses`: 1 dòng với `vietnamese_meaning = "Nhân viên kế toán / kiểm toán"`.
*   **Trường hợp 2: Từ `lease` (Như trong Hình 2 của bạn)**
    *   `vocabularies`: `word = "lease"`
    *   `vocab_forms`: Có **2 dòng**:
        *   **Form 1 (`part_of_speech = 'V'`):** Liên kết với **2 dòng** trong `vocab_senses`:
            *   Sense 1.1: `pattern = "+ sth from sb"`, `vietnamese_meaning = "thuê, mướn từ ai đó"`
            *   Sense 1.2: `pattern = "+ sb sth"`, `vietnamese_meaning = "cho ai đó thuê gì đó"`
        *   **Form 2 (`part_of_speech = 'N'`, `countability = 'COUNTABLE'`):** Liên kết với **1 dòng** trong `vocab_senses`:
            *   Sense 2.1: `collocation = "lease agreement"`, `synonyms = "rental"`, `vietnamese_meaning = "hợp đồng thuê mướn (dài hạn)"`, kèm `vocab_examples` = `"A legal agreement..."`.

---

## PHẦN 4: KIẾN TRÚC BACKEND (JAVA SPRING BOOT)

### 1. Cấu trúc thư mục chuẩn
```text
src/main/java/com/dolvocab/app/
├── controller/
│   ├── VocabularyController.java
│   ├── CategoryController.java
│   ├── NoteListController.java
│   └── WordFamilyController.java
├── dto/
│   ├── request/
│   │   ├── VocabCreateRequest.java
│   │   └── VocabFilterRequest.java
│   └── response/
│       └── VocabDetailResponse.java
├── entity/
│   ├── Vocabulary.java
│   ├── VocabForm.java
│   ├── VocabSense.java
│   ├── VocabExample.java
│   ├── Category.java
│   ├── NoteList.java
│   └── WordFamily.java
├── repository/
│   ├── VocabularyRepository.java
│   └── specification/
│       └── VocabularySpecification.java  <-- Dùng JPA Specification để lọc đa điều kiện
└── service/
    └── VocabularyService.java
```

### 2. Thiết kế JSON Payload (DTO) khi Thêm Mới / Hiển Thị Từ Vựng
Khi ReactJS gửi dữ liệu lên Spring Boot để tạo mới một từ phức tạp (như từ `lease` hoặc `accountant`), cấu trúc JSON sẽ như sau:

```json
{
  "word": "lease",
  "phonetic": "/liːs/",
  "wordFamilyId": 12,
  "categoryIds": [1, 2],
  "noteListId": 5,
  "generalNote": "Từ thường gặp trong TOEIC và IELTS Reading chủ đề Business",
  "forms": [
    {
      "partOfSpeech": "V",
      "countability": "NOT_APPLICABLE",
      "senses": [
        {
          "pattern": "+ sth from sb",
          "collocation": null,
          "synonyms": null,
          "vietnameseMeaning": "thuê, mướn từ ai đó",
          "examples": ["They leased the office from a local company."]
        },
        {
          "pattern": "+ sb sth",
          "collocation": null,
          "synonyms": null,
          "vietnameseMeaning": "cho ai đó thuê gì đó",
          "examples": []
        }
      ]
    },
    {
      "partOfSpeech": "N",
      "countability": "COUNTABLE",
      "senses": [
        {
          "pattern": null,
          "collocation": "lease agreement",
          "synonyms": "rental",
          "vietnameseMeaning": "hợp đồng thuê mướn (dài hạn)",
          "examples": ["A legal agreement that allows you to use a building or land."]
        }
      ]
    }
  ]
}
```

### 3. Danh sách RESTful APIs cần thiết
1.  **Quản lý & Lọc Từ Vựng (Master & Filtered View):**
    *   `GET /api/v1/vocabularies`
        *   **Query Params hỗ trợ tìm kiếm & bộ lọc:**
            *   `keyword`: Tìm theo từ vựng, pattern, collocation, hoặc nghĩa tiếng Việt.
            *   `categoryIds`: Lọc theo 1 hoặc nhiều danh mục (VD: `?categoryIds=1,3`).
            *   `noteListId`: Xem theo từng thẻ List bài đọc (VD: `?noteListId=2`). Nếu bỏ trống $\rightarrow$ Xem Tổng Từ Vựng (Master List).
            *   `partOfSpeech`: Lọc theo từ loại (`N`, `V`, `ADJ`, `ADV`).
            *   `wordFamilyId`: Xem theo cụm Word Family.
    *   `POST /api/v1/vocabularies`: Thêm từ vựng mới (nếu chọn `noteListId`, hệ thống tự động lưu từ vào bảng tổng `vocabularies` VÀ tạo liên kết trong `note_list_vocabs`).
    *   `PUT /api/v1/vocabularies/{id}`: Cập nhật từ vựng (thêm nghĩa, thêm pattern, gắn thêm danh mục).
    *   `DELETE /api/v1/vocabularies/{id}`: Xóa từ vựng.
2.  **Quản lý Danh mục (Categories):**
    *   `GET /api/v1/categories`: Lấy danh sách danh mục kèm số lượng từ.
    *   `POST /api/v1/categories`: Tạo danh mục mới nhanh (VD: *"Từ vựng chỉ người"*).
3.  **Quản lý Thẻ List Bài Đọc (Reading Note Lists):**
    *   `GET /api/v1/note-lists`: Lấy các thẻ bài đọc (LIST 01, LIST 02...).
    *   `POST /api/v1/note-lists`: Tạo thẻ ghi chú mới sau khi làm bài Reading.
    *   `POST /api/v1/note-lists/{listId}/add-existing-vocab/{vocabId}`: Đưa một từ đã có sẵn trong kho vào thẻ Reading hiện tại.

### 4. Giải pháp Lọc Đa Điều Kiện trong Spring Boot (`VocabularySpecification.java`)
Để thanh Search và bộ lọc hoạt động mượt mà khi kết hợp nhiều điều kiện cùng lúc, bạn sử dụng `JpaSpecificationExecutor`:

```java
public class VocabularySpecification {
    public static Specification<Vocabulary> filterVocabularies(
            String keyword, List<Long> categoryIds, Long noteListId, 
            PartOfSpeech pos, Long wordFamilyId) {
        
        return (root, query, cb) -> {
            query.distinct(true); // Tránh trùng lặp dòng khi JOIN nhiều bảng 1-N
            List<Predicate> predicates = new ArrayList<>();

            // 1. Tìm kiếm theo Keyword (tìm trong word, pattern, collocation, nghĩa TV)
            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Join<Vocabulary, VocabForm> formJoin = root.join("forms", JoinType.LEFT);
                Join<VocabForm, VocabSense> senseJoin = formJoin.join("senses", JoinType.LEFT);

                Predicate wordPred = cb.like(cb.lower(root.get("word")), pattern);
                Predicate meaningPred = cb.like(cb.lower(senseJoin.get("vietnameseMeaning")), pattern);
                Predicate collocationPred = cb.like(cb.lower(senseJoin.get("collocation")), pattern);
                
                predicates.add(cb.or(wordPred, meaningPred, collocationPred));
            }

            // 2. Lọc theo Danh mục (Categories)
            if (categoryIds != null && !categoryIds.isEmpty()) {
                Join<Vocabulary, Category> categoryJoin = root.join("categories", JoinType.INNER);
                predicates.add(categoryJoin.get("id").in(categoryIds));
            }

            // 3. Lọc theo Thẻ List (Reading Note List)
            if (noteListId != null) {
                Join<Vocabulary, NoteList> listJoin = root.join("noteLists", JoinType.INNER);
                predicates.add(cb.equal(listJoin.get("id"), noteListId));
            }

            // 4. Lọc theo Từ loại (N, V, ADJ, ADV)
            if (pos != null) {
                Join<Vocabulary, VocabForm> formJoin = root.join("forms", JoinType.INNER);
                predicates.add(cb.equal(formJoin.get("partOfSpeech"), pos));
            }

            // 5. Lọc theo Word Family
            if (wordFamilyId != null) {
                predicates.add(cb.equal(root.get("wordFamily").get("id"), wordFamilyId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
```

---

## PHẦN 5: KIẾN TRÚC FRONTEND (REACTJS + TAILWINDCSS)

### 1. Thư viện khuyên dùng
*   **UI & Styling:** `TailwindCSS` + `Lucide React` (Icons) + `shadcn/ui` (Radix UI hỗ trợ Modal, Combobox chọn nhiều danh mục cực đẹp).
*   **Quản lý Form phức tạp (Thêm nhiều từ loại/nhiều nghĩa):** `React Hook Form` (sử dụng hook `useFieldArray` để thêm/xóa các dòng nghĩa, pattern, collocation động ngay trong bảng).
*   **Gọi API & Caching bộ lọc:** `@tanstack/react-query` + `axios`.

### 2. Kỹ thuật Render Bảng Gộp Dòng (Row-Span Table như Hình 2) trong ReactJS
Trong Hình 2 (Google Sheets), một từ như `lease` gộp 3 dòng ở cột `Vocab`, cột `Form` gộp 2 dòng cho `(v)` và 1 dòng cho `(n)`. Để render chính xác cấu trúc này bằng HTML `<table>` trong React, bạn dùng kỹ thuật tính `rowSpan` như sau:

```jsx
// Minh họa logic tính rowSpan và hiển thị bảng từ vựng chuẩn như Google Sheets của bạn
const VocabularyTable = ({ vocabList }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-red-600 text-white uppercase text-xs font-semibold">
          <tr>
            <th className="py-3.5 px-4 border-r border-red-500">Vocab</th>
            <th className="py-3.5 px-3 border-r border-red-500 text-center">Form</th>
            <th className="py-3.5 px-4 border-r border-red-500">Pattern</th>
            <th className="py-3.5 px-4 border-r border-red-500">Collocation</th>
            <th className="py-3.5 px-4 border-r border-red-500">Synonym</th>
            <th className="py-3.5 px-4 border-r border-red-500">Meaning (Nghĩa TV)</th>
            <th className="py-3.5 px-4">Example & Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {vocabList.map((vocab) => {
            // Tính tổng số dòng (senses) của toàn bộ từ vựng này
            const totalVocabRows = vocab.forms.reduce(
              (acc, form) => acc + Math.max(form.senses.length, 1),
              0
            );

            let isFirstRowOfVocab = true;

            return vocab.forms.map((form) => {
              const totalFormRows = Math.max(form.senses.length, 1);
              let isFirstRowOfForm = true;

              return form.senses.map((sense, senseIdx) => {
                const rowElement = (
                  <tr key={`${vocab.id}-${form.id}-${sense.id || senseIdx}`} className="hover:bg-red-50/40 transition-colors">
                    {/* Cột 1: VOCAB (Chỉ render ở dòng đầu tiên của từ và gộp rowSpan) */}
                    {isFirstRowOfVocab && (
                      <td rowSpan={totalVocabRows} className="py-3 px-4 font-bold text-slate-800 border-r border-slate-200 align-middle bg-white">
                        <div className="text-base text-slate-900">{vocab.word}</div>
                        {/* Hiển thị các thẻ Danh mục (Categories) */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {vocab.categories?.map((cat) => (
                            <span key={cat.id} className="px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-600 rounded-full border border-red-200">
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      </td>
                    )}

                    {/* Cột 2: FORM (Chỉ render ở dòng đầu tiên của từ loại và gộp rowSpan) */}
                    {isFirstRowOfForm && (
                      <td rowSpan={totalFormRows} className="py-3 px-3 text-center border-r border-slate-200 align-middle bg-slate-50/50">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-700">
                          ({form.partOfSpeech.toLowerCase()})
                        </span>
                        {form.partOfSpeech === 'N' && form.countability !== 'NOT_APPLICABLE' && (
                          <div className="text-[10px] text-slate-500 font-semibold mt-1">
                            {form.countability === 'COUNTABLE' ? '[C]' : form.countability === 'UNCOUNTABLE' ? '[U]' : '[C/U]'}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Các cột chi tiết theo từng nét nghĩa (Sense) */}
                    <td className="py-2.5 px-4 border-r border-slate-200 font-medium text-slate-700">
                      {sense.pattern || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200 text-indigo-700 font-medium">
                      {sense.collocation || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200 text-slate-600">
                      {sense.synonyms || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200 font-semibold text-slate-800">
                      {sense.vietnameseMeaning}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 italic">
                      {sense.examples?.map((ex, i) => (
                        <div key={i}>• {ex}</div>
                      ))}
                      {sense.usageNote && (
                        <div className="text-xs text-red-600 not-italic mt-1">💡 {sense.usageNote}</div>
                      )}
                    </td>
                  </tr>
                );

                isFirstRowOfVocab = false;
                isFirstRowOfForm = false;
                return rowElement;
              });
            });
          })}
        </tbody>
      </table>
    </div>
  );
};
```

---

## PHẦN 6: LỘ TRÌNH THỰC HIỆN (IMPLEMENTATION ROADMAP)
1.  **Bước 1 (Tạo UI với Google Stitch):** Copy lần lượt **Prompt 1** và **Prompt 2** ở Phần 2 vào Google Stitch để lấy thiết kế giao diện và mã HTML/Tailwind mẫu.
2.  **Bước 2 (Khởi tạo Database):** Chạy đoạn script SQL ở Phần 3 trong MySQL Workbench hoặc DBeaver.
3.  **Bước 3 (Xây dựng Backend Spring Boot):**
    *   Tạo project với `Spring Web`, `Spring Data JPA`, `MySQL Driver`, `Lombok`.
    *   Cấu hình quan hệ `@OneToMany(mappedBy = "...", cascade = CascadeType.ALL, orphanRemoval = true)` giữa `Vocabulary` $\rightarrow$ `VocabForm` $\rightarrow$ `VocabSense` $\rightarrow$ `VocabExample` để chỉ cần lưu `Vocabulary` là tự động lưu toàn bộ bảng con.
4.  **Bước 4 (Xây dựng Frontend ReactJS):**
    *   Lắp ghép giao diện từ Google Stitch với component `VocabularyTable` (có gộp dòng `rowSpan`) và Modal thêm từ mới.