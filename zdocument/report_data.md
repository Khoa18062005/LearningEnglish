# KẾ HOẠCH CHUYỂN ĐỔI CSDL: MySQL → MongoDB — LexiconVocab (LearningEnglish)

| Thông tin | Giá trị |
|---|---|
| Ngày lập | 21/11/2026 |
| Commit nền | `235f1ca` |
| Nhánh triển khai | `feature/mongodb` |
| Kiểu ID đã chốt | **ObjectId** (24 ký tự hex, frontend coi là chuỗi mờ) |
| Mục tiêu | Chuyển toàn bộ lưu trữ sang MongoDB theo mô hình document, giữ nguyên hợp đồng API (đường dẫn, cấu trúc JSON), chỉ đổi kiểu ID từ số sang chuỗi |
| Tài liệu liên quan | `report_error.md` (nên xử lý SEC-01, SEC-02, BE-01 song song) |

---

## 1. Bảng theo dõi tiến độ

**Trạng thái:** ⬜ Chưa làm · 🔄 Đang làm · ✅ Hoàn thành · ⏸️ Tạm hoãn

| Giai đoạn | ID | Công việc | Ước lượng | Trạng thái |
|---|---|---|---|---|
| 0. Chuẩn bị | M0-01 | Commit/stash 6 file đang sửa, tạo nhánh `feature/mongodb`, tag `before-mongodb` | 0,5 giờ | ⬜ |
| | M0-02 | Tạo cluster MongoDB Atlas (replica set) + MongoDB local qua Docker cho dev | 1 giờ | ⬜ |
| | M0-03 | Sao lưu MySQL (`mysqldump`) cả local và Aiven | 0,5 giờ | ⬜ |
| 1. Nền tảng | M1-01 | Đổi dependency JPA/MySQL → Spring Data MongoDB, cấu hình kết nối | 1 giờ | ⬜ |
| | M1-02 | Bật auditing (`@CreatedDate`, `@LastModifiedDate`), transaction manager | 1 giờ | ⬜ |
| | M1-03 | Tạo index qua code (`MongoIndexConfig`) | 1 giờ | ⬜ |
| 2. Document | M2-01 | `User`, `OtpVerification` (thêm `attempts`, TTL) | 1 giờ | ⬜ |
| | M2-02 | `Category`, `WordFamily`, `NoteFolder` | 1 giờ | ⬜ |
| | M2-03 | `NoteList` nhúng `passages[]` | 2 giờ | ⬜ |
| | M2-04 | `Vocabulary` nhúng `forms[] → senses[] → examples[]` | 3 giờ | ⬜ |
| 3. Repository | M3-01 | Viết lại 8 repository (method derived query) | 3 giờ | ⬜ |
| | M3-02 | Thay `VocabularySpecification` bằng `MongoTemplate` + `Criteria` | 4 giờ | ⬜ |
| | M3-03 | Aggregation đếm số từ theo Category / NoteList | 3 giờ | ⬜ |
| 4. Service | M4-01 | `AuthServiceImpl` + `CustomUserDetailsService` + `SecurityUtils` | 2 giờ | ⬜ |
| | M4-02 | `CategoryServiceImpl`, `WordFamilyServiceImpl`, `NoteFolderServiceImpl` | 4 giờ | ⬜ |
| | M4-03 | `NoteListServiceImpl` (passages nhúng, reorder) | 4 giờ | ⬜ |
| | M4-04 | `VocabularyServiceImpl` (tạo/sửa/xóa cây lồng, liên kết) | 6 giờ | ⬜ |
| | M4-05 | Xóa dây chuyền thủ công (cascade) | 2 giờ | ⬜ |
| | M4-06 | Đổi DTO, controller từ `Long` → `String`; validate ObjectId | 2 giờ | ⬜ |
| | M4-07 | Gỡ `DatabaseConstraintMigration`, `OtpCleanupScheduler`; chuyển `DataSeeder` | 1 giờ | ⬜ |
| 5. Dữ liệu | M5-01 | Viết công cụ migrate MySQL → MongoDB (profile `migrate`) | 6 giờ | ⬜ |
| | M5-02 | Chạy thử trên bản sao dữ liệu local, đối chiếu số lượng | 2 giờ | ⬜ |
| 6. Frontend | M6-01 | Sửa ~47 chỗ giả định ID là số | 4 giờ | ⬜ |
| | M6-02 | Sắp xếp theo `createdAt`/`sortOrder` thay vì `id` | 1 giờ | ⬜ |
| 7. Kiểm thử | M7-01 | Integration test với Testcontainers MongoDB | 6 giờ | ⬜ |
| | M7-02 | Kiểm thử thủ công toàn bộ luồng (checklist mục 9) | 3 giờ | ⬜ |
| 8. Triển khai | M8-01 | Migrate dữ liệu thật, chuyển cấu hình production, theo dõi | 2 giờ | ⬜ |
| | M8-02 | Gỡ code/cấu hình MySQL sau 2 tuần chạy ổn định | 1 giờ | ⬜ |

**Tổng ước lượng:** khoảng 75 giờ làm việc (~2–3 tuần nếu làm bán thời gian). Ước lượng mang tính tham khảo.

---

## 2. Hiện trạng (MySQL)

```
User ─┬─ Vocabulary ── VocabForm ── VocabSense ── VocabExample   (cây 4 tầng)
      │      ├── N–N ── Category        (bảng nối vocab_categories)
      │      ├── N–N ── NoteList        (bảng nối note_list_vocabs)
      │      └── N–1 ── WordFamily
      ├─ NoteFolder ── NoteList ── ReadingPassage
      ├─ Category
      └─ WordFamily
OtpVerification (độc lập)
```

**13 bảng:** `users`, `vocabularies`, `vocab_forms`, `vocab_senses`, `vocab_examples`, `vocab_categories`, `note_list_vocabs`, `categories`, `word_families`, `note_folders`, `note_lists`, `reading_passages`, `otp_verifications`.

**Dấu hiệu dữ liệu phù hợp mô hình document:**
- `Vocabulary.meaningDetailsJson`: JSON lưu trong cột TEXT.
- `WordFamily.memberOrder`: danh sách ID nối bằng dấu phẩy.
- `DatabaseConstraintMigration`: gỡ unique index thủ công mỗi lần khởi động.
- Mỗi lần đọc một từ vựng phải JOIN 4 bảng.

---

## 3. Thiết kế đích (MongoDB): 7 collection

### 3.1. Bảng ánh xạ

| Bảng MySQL | Collection MongoDB | Cách chuyển |
|---|---|---|
| `users` | `users` | 1–1 |
| `vocabularies` | `vocabularies` | Document gốc |
| `vocab_forms` | → `vocabularies.forms[]` | **Nhúng** |
| `vocab_senses` | → `vocabularies.forms[].senses[]` | **Nhúng** |
| `vocab_examples` | → `vocabularies.forms[].senses[].examples[]` | **Nhúng** |
| `vocab_categories` | → `vocabularies.categoryIds[]` | Mảng tham chiếu |
| `note_list_vocabs` | → `vocabularies.noteListIds[]` | Mảng tham chiếu |
| `categories` | `categories` | 1–1 |
| `word_families` | `word_families` | `memberOrder` → mảng `ObjectId` |
| `note_folders` | `note_folders` | 1–1 |
| `note_lists` | `note_lists` | Document gốc |
| `reading_passages` | → `note_lists.passages[]` | **Nhúng** |
| `otp_verifications` | `otp_verifications` | Thêm `attempts`, TTL index |

### 3.2. Nguyên tắc thiết kế

| Nguyên tắc | Áp dụng |
|---|---|
| **Nhúng** khi dữ liệu con chỉ thuộc về một cha, luôn được đọc cùng cha, số lượng có giới hạn | forms, senses, examples, passages |
| **Tham chiếu** khi quan hệ N–N hoặc dữ liệu được dùng ở nhiều nơi | Category, NoteList, WordFamily |
| Mảng tham chiếu đặt ở **phía nhiều-ít** | Một từ thuộc vài danh mục nên `categoryIds[]` đặt trong `vocabularies` |
| Mọi document thuộc user đều có `userId` và index bắt đầu bằng `userId` | Đảm bảo cô lập dữ liệu và hiệu năng |
| Phần tử nhúng có `_id` riêng (ObjectId) | Frontend vẫn sửa/xóa được từng form, sense, passage |

> **Giới hạn cần nhớ:** mỗi document tối đa 16 MB. Một `note_list` chứa nhiều bài đọc dài (`LONGTEXT`) là rủi ro duy nhất. Nếu một danh sách vượt khoảng 5 MB, tách `passages` thành collection riêng `reading_passages` (phương án dự phòng, xem mục 10).

### 3.3. Chi tiết từng collection

#### `users`
```json
{
  "_id": ObjectId,
  "email": "user@gmail.com",
  "password": "$2a$10$...",
  "fullName": "Nguyễn Văn A",
  "dateOfBirth": ISODate,
  "gender": "MALE | FEMALE | OTHER",
  "address": {
    "provinceCode": 79, "provinceName": "TP. Hồ Chí Minh",
    "wardCode": 26734, "wardName": "...", "detail": "..."
  },
  "role": "ROLE_USER",
  "createdAt": ISODate, "updatedAt": ISODate
}
```
- **Index:** `{ email: 1 }` unique.
- Gom 5 trường địa chỉ thành object `address`. DTO vẫn trả về dạng phẳng để không đổi API.

#### `vocabularies`
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "word": "lease",
  "wordLower": "lease",
  "pos": "n",
  "phonetic": "/liːs/",
  "audioUrl": null,
  "generalNote": "...",
  "meaning": "...",
  "closeMeanings": "...",
  "synonyms": "...",
  "meaningDetails": [ { ... } ],
  "wordFamilyId": ObjectId | null,
  "categoryIds": [ObjectId],
  "noteListIds": [ObjectId],
  "forms": [
    {
      "_id": ObjectId,
      "partOfSpeech": "NOUN",
      "countability": "COUNTABLE",
      "displayOrder": 1,
      "senses": [
        {
          "_id": ObjectId,
          "pattern": "+ sth from sb",
          "collocation": "lease agreement",
          "synonyms": "rental",
          "closeMeanings": "...",
          "vietnameseMeaning": "hợp đồng thuê",
          "usageNote": "...",
          "displayOrder": 1,
          "examples": [
            { "_id": ObjectId, "sentence": "...", "translation": "..." }
          ]
        }
      ]
    }
  ],
  "createdAt": ISODate, "updatedAt": ISODate
}
```
- `meaningDetailsJson` (chuỗi JSON) được parse thành mảng thật `meaningDetails`.
- `wordLower`: bản viết thường của `word`, dùng cho tra cứu không phân biệt hoa thường, thay các method `...IgnoreCase`.
- **Index:**
  - `{ userId: 1, _id: -1 }`: danh sách và phân trang cursor.
  - `{ userId: 1, wordLower: 1, pos: 1 }`: kiểm tra trùng từ (không unique, vì giữ hành vi cho phép nhiều dạng từ).
  - `{ userId: 1, categoryIds: 1 }`, `{ userId: 1, noteListIds: 1 }`, `{ userId: 1, wordFamilyId: 1 }`: lọc và đếm.
  - `{ userId: 1, "forms.partOfSpeech": 1 }`: lọc theo từ loại.

#### `categories`
```json
{ "_id": ObjectId, "userId": ObjectId, "name": "Finance", "nameLower": "finance",
  "colorCode": "#E31E24", "description": "...", "createdAt": ISODate }
```
- **Index:** `{ userId: 1, nameLower: 1 }` **unique** (thay `uk_user_category`, đồng thời không phân biệt hoa thường).

#### `word_families`
```json
{ "_id": ObjectId, "userId": ObjectId, "rootWord": "employ", "rootWordLower": "employ",
  "description": "...", "memberOrder": [ObjectId], "createdAt": ISODate }
```
- **Index:** `{ userId: 1, rootWordLower: 1 }` unique.

#### `note_folders`
```json
{ "_id": ObjectId, "userId": ObjectId, "code": "ETS2024", "name": "ETS TOEIC 2024",
  "description": "...", "sortOrder": 0, "createdAt": ISODate }
```
- **Index:** `{ userId: 1, sortOrder: 1 }`, `{ userId: 1, code: 1 }`.

#### `note_lists`
```json
{
  "_id": ObjectId, "userId": ObjectId, "folderId": ObjectId | null,
  "title": "Reading Cam 18", "code": "LIST01", "codeLower": "list01",
  "sourceReference": "...", "passage": "...", "note": "...", "sortOrder": 0,
  "passages": [
    { "_id": ObjectId, "title": "Passage 1", "content": "<p>...</p>",
      "wordCount": 850, "sortOrder": 0, "createdAt": ISODate, "updatedAt": ISODate }
  ],
  "createdAt": ISODate
}
```
- **Index:** `{ userId: 1, sortOrder: 1 }`, `{ userId: 1, folderId: 1, sortOrder: 1 }`, `{ userId: 1, codeLower: 1 }` (unique khi `code` tồn tại → dùng partial index).

#### `otp_verifications`
```json
{ "_id": ObjectId, "email": "user@gmail.com", "otpHash": "...", "attempts": 0,
  "expiresAt": ISODate, "createdAt": ISODate }
```
- **Index:** `{ email: 1 }`; `{ expiresAt: 1 }` với **`expireAfterSeconds: 0`** (TTL). MongoDB tự xóa OTP hết hạn, nên gỡ được `OtpCleanupScheduler`.
- Kết hợp xử lý SEC-02 (giới hạn số lần thử, lưu hash) trong `report_error.md`.

---

## 4. Thay đổi backend

### 4.1. Dependency (`server/pom.xml`)
| Gỡ | Thêm |
|---|---|
| `spring-boot-starter-data-jpa` | `spring-boot-starter-data-mongodb` |
| `mysql-connector-j` | `org.testcontainers:mongodb` + `spring-boot-testcontainers` (test) |

> Trong giai đoạn migrate dữ liệu (M5), **tạm giữ** `mysql-connector-j` và `spring-boot-starter-jdbc` để công cụ migrate đọc được MySQL. Gỡ ở bước M8-02.

### 4.2. Cấu hình
```properties
# application.properties
spring.data.mongodb.uri=${MONGODB_URI}
spring.data.mongodb.database=lexicon_vocab
spring.data.mongodb.auto-index-creation=false   # index tạo tường minh trong MongoIndexConfig
```
- Dev: `mongodb://localhost:27017/?replicaSet=rs0` (Docker, chạy replica set một node để dùng được transaction).
- Production: chuỗi `mongodb+srv://...` của Atlas, đặt qua biến môi trường. **Không** ghi vào file.

### 4.3. Lớp cấu hình mới
| Lớp | Nhiệm vụ |
|---|---|
| `MongoConfig` | `@EnableMongoAuditing`; bean `MongoTransactionManager` |
| `MongoIndexConfig` | Tạo toàn bộ index ở mục 3.3 khi khởi động (idempotent) |
| `ObjectIdValidator` (util) | Kiểm tra chuỗi ID hợp lệ (`ObjectId.isValid`), ném `ResourceNotFoundException` nếu sai |

### 4.4. Entity → Document
| Hiện tại (JPA) | Sau chuyển đổi |
|---|---|
| `@Entity`, `@Table` | `@Document(collection = "...")` |
| `@Id @GeneratedValue Long id` | `@Id String id` (Spring tự ánh xạ ObjectId ↔ String) |
| `@ManyToOne User user` | `@Field(targetType = OBJECT_ID) String userId` |
| `@OneToMany` con (form/sense/example/passage) | `List<...>` POJO nhúng, không có `@Document` |
| `@ManyToMany Set<Category>` | `List<String> categoryIds` |
| `@CreationTimestamp` / `@UpdateTimestamp` | `@CreatedDate` / `@LastModifiedDate` |
| `@Column(length=...)` | Bỏ, chuyển giới hạn độ dài sang validate ở DTO |
| `@Enumerated(STRING)` | Giữ enum, Spring lưu dạng chuỗi mặc định |

**Quy ước:** trong Java dùng `String` cho mọi ID, lưu xuống Mongo dưới dạng `ObjectId` (qua `@Field(targetType = FieldType.OBJECT_ID)` cho các trường tham chiếu).

### 4.5. Repository: ánh xạ method

| Repository | Method hiện tại | Sau chuyển đổi |
|---|---|---|
| `UserRepository` | `findByEmail`, `existsByEmail` | Giữ nguyên tên |
| `VocabularyRepository` | `findByIdAndUserId`, `existsByIdAndUserId`, `deleteByIdAndUserId`, `findAllByUserId` | Giữ nguyên tên, tham số `String` |
| | `findAllByWordIgnoreCaseAndUserId`, `findFirstBy...`, `findByWordIgnoreCaseAndPos...` | Đổi sang `...ByWordLowerAndUserId` (truyền `word.toLowerCase()`) |
| `CategoryRepository` | `findByNameIgnoreCaseAndUserId`, `existsBy...` | `...ByNameLowerAndUserId` |
| | `findCategoriesWithVocabCountByUserId` (`@Query` GROUP BY) | **Aggregation** (mục 4.6) |
| `NoteListRepository` | `@Query ... COALESCE(sortOrder, 999999)` | `findAllByUserId(userId, Sort.by("sortOrder","_id"))`; migrate gán `sortOrder` mặc định nên không còn null |
| | `findNoteListsWithVocabCountByUserId` | **Aggregation** (mục 4.6) |
| | `findAllByFolderId...` | Giữ tên, tham số `String` |
| `NoteFolderRepository` | `findAllByUserIdOrdered` | Tương tự NoteList |
| `ReadingPassageRepository` | Toàn bộ | **Gỡ bỏ**, passages nằm trong `NoteList` |
| `WordFamilyRepository` | `...RootWordIgnoreCase...` | `...RootWordLower...` |
| `OtpVerificationRepository` | `deleteByEmail`, `findTopByEmailOrderByCreatedAtDesc` | Giữ tên |
| | `deleteExpiredOtps` | **Gỡ bỏ** (TTL index lo) |

### 4.6. Các truy vấn cần viết lại đặc biệt

**a) Tìm kiếm + lọc + cursor (`VocabularySpecification` → `VocabularyQueryRepository` dùng `MongoTemplate`)**
```java
Criteria c = Criteria.where("userId").is(new ObjectId(userId));
if (cursor != null)          c.and("_id").lt(new ObjectId(cursor));
if (categoryIds != null)     c.and("categoryIds").in(toObjectIds(categoryIds));
if (noteListId != null)      c.and("noteListIds").is(new ObjectId(noteListId));
if (wordFamilyId != null)    c.and("wordFamilyId").is(new ObjectId(wordFamilyId));
if (pos != null)             c.and("forms.partOfSpeech").is(pos.toUpperCase());
if (keyword != null) {
    String rx = Pattern.quote(keyword.trim());
    c.orOperator(
        Criteria.where("word").regex(rx, "i"),
        Criteria.where("meaning").regex(rx, "i"),
        Criteria.where("forms.senses.vietnameseMeaning").regex(rx, "i"),
        Criteria.where("forms.senses.collocation").regex(rx, "i"),
        Criteria.where("forms.senses.pattern").regex(rx, "i"),
        Criteria.where("forms.senses.synonyms").regex(rx, "i"));
}
Query q = Query.query(c).with(Sort.by(DESC, "_id")).limit(size + 1);
```
- **Bắt buộc `Pattern.quote`** để chặn regex injection / ReDoS từ từ khóa người dùng nhập.
- `categoryName` (lọc theo tên danh mục): tra `categoryId` trước rồi lọc theo ID.
- **Nâng cấp sau (tùy chọn):** Atlas Search với analyzer hỗ trợ tiếng Việt, tìm không dấu và tìm gần đúng tốt hơn regex.

**b) Đếm số từ theo danh mục / danh sách (thay `GROUP BY`)**
```javascript
db.vocabularies.aggregate([
  { $match: { userId: <uid> } },
  { $unwind: "$noteListIds" },
  { $group: { _id: "$noteListIds", vocabCount: { $sum: 1 } } }
])
```
Sau đó ghép kết quả với danh sách `note_lists` (và `note_folders` để lấy `folderCode`, `folderName`) trong service. Áp dụng tương tự cho `categoryIds`.

**c) Sắp xếp `COALESCE(sortOrder, 999999)`**: công cụ migrate gán `sortOrder` cho mọi bản ghi null (bằng thứ tự `id` cũ), từ đó chỉ cần `Sort.by("sortOrder", "_id")`.

**d) Reorder:** dùng `BulkOperations` (một lần gọi DB) thay vì vòng lặp `save` từng bản ghi:
```java
BulkOperations ops = mongoTemplate.bulkOps(UNORDERED, NoteList.class);
for (int i = 0; i < ids.size(); i++)
  ops.updateOne(query(where("_id").is(id(i)).and("userId").is(uid)), update("sortOrder", i));
ops.execute();
```

**e) Phân biệt ID và mã danh sách (`VocabCreateRequest.noteListId`)**: hiện code dùng `Long.parseLong` để đoán là ID hay `code`. Sau chuyển đổi dùng `ObjectId.isValid(identifier)`; không hợp lệ thì coi là `code`.

### 4.7. Xóa dây chuyền (MySQL từng tự xử lý qua bảng nối)
| Khi xóa | Phải làm thêm (trong 1 transaction) |
|---|---|
| `Category` | `updateMulti(vocabularies, {userId}, $pull: {categoryIds: catId})` |
| `NoteList` | `$pull: {noteListIds: listId}` trên `vocabularies` |
| `NoteFolder` | Đặt `folderId = null` cho các `note_lists` thuộc thư mục (giữ hành vi hiện tại, cần xác nhận lại trong `NoteFolderServiceImpl`) |
| `WordFamily` | `$unset: {wordFamilyId}` trên `vocabularies` liên quan |
| `Vocabulary` | Gỡ ID khỏi `word_families.memberOrder` |
| `User` (nếu có chức năng xóa tài khoản) | Xóa mọi document có `userId` |

Đánh dấu các method này bằng `@Transactional` (dùng `MongoTransactionManager`).

### 4.8. DTO & Controller
- Mọi `Long id` / `List<Long>` trong DTO → `String` / `List<String>`: `NoteListCreateRequest.folderId`, `ReadingPassageRequest.id`, `ReorderRequest.ids`, `VocabCreateRequest.wordFamilyId`, `categoryIds`, và các response DTO.
- `@PathVariable Long id` → `@PathVariable String id`, kiểm tra bằng `ObjectIdValidator`.
- Endpoint `reorder`: dùng `@Valid @RequestBody ReorderRequest`, bỏ `parseIds(Object)` (xử lý luôn BE-03).
- `GET /vocabularies/cursor?cursor=...`: cursor trở thành chuỗi ObjectId.

### 4.9. Lớp bị gỡ / thay thế
| Lớp | Xử lý |
|---|---|
| `DatabaseConstraintMigration` | Gỡ (không còn bảng/index MySQL) |
| `OtpCleanupScheduler` | Gỡ (TTL index) |
| `ReadingPassageRepository`, entity `ReadingPassage`, `VocabForm`, `VocabSense`, `VocabExample` | Chuyển thành POJO nhúng |
| `VocabularySpecification` | Thay bằng `VocabularyQueryRepository` |
| `DataSeeder` | Viết lại bằng repository Mongo; chỉ chạy ở profile `dev` |

---

## 5. Chuyển dữ liệu MySQL → MongoDB

### 5.1. Công cụ
Một `CommandLineRunner` chỉ chạy với profile **`migrate`** (`MySqlToMongoMigrator`), đọc MySQL qua `JdbcTemplate` (datasource thứ hai) và ghi vào Mongo qua `MongoTemplate`:
```bash
SPRING_PROFILES_ACTIVE=migrate MYSQL_URL=... MONGODB_URI=... ./mvnw spring-boot:run
```

### 5.2. Thứ tự và cách ánh xạ ID
Mỗi bảng tạo một bảng tra `Map<Long, ObjectId>` trong bộ nhớ (dữ liệu cá nhân nên kích thước nhỏ):

1. `users` → lưu `userIdMap`
2. `categories`, `word_families`, `note_folders` → map tương ứng
3. `note_lists` + `reading_passages` (nhúng) → `noteListIdMap`
4. `vocabularies` + `vocab_forms` + `vocab_senses` + `vocab_examples` (nhúng) + `vocab_categories` + `note_list_vocabs` (thành mảng ID)
5. `word_families.memberOrder`: chuyển chuỗi `"12,15,20"` → mảng `ObjectId` qua `vocabIdMap`
6. Bỏ qua `otp_verifications` (dữ liệu tạm)

**Giữ thứ tự thời gian:** sinh ObjectId theo `createdAt` cũ (`new ObjectId(Date.from(createdAt))`), để sắp xếp và phân trang theo `_id` vẫn đúng thứ tự như trước.

**Chuẩn hóa khi chuyển:** điền `wordLower`, `nameLower`, `rootWordLower`, `codeLower`; gán `sortOrder` cho bản ghi null; parse `meaningDetailsJson` thành mảng (lỗi parse thì giữ nguyên chuỗi gốc vào `meaningDetailsRaw` và ghi log).

### 5.3. Đối chiếu sau khi chạy
| Kiểm tra | Điều kiện đạt |
|---|---|
| Số user, category, word family, folder, note list | Bằng số dòng MySQL tương ứng |
| Số vocabulary | Bằng số dòng `vocabularies` |
| Tổng forms / senses / examples nhúng | Bằng số dòng 3 bảng con |
| Tổng phần tử `categoryIds`, `noteListIds` | Bằng số dòng 2 bảng nối |
| Tổng passages nhúng | Bằng số dòng `reading_passages` |
| Lấy mẫu ngẫu nhiên 20 từ | So sánh JSON từ API cũ và API mới giống nhau (trừ ID) |

Công cụ in báo cáo đối chiếu và **dừng với mã lỗi** nếu lệch. Có thể chạy lại nhiều lần (xóa sạch collection đích trước khi ghi).

---

## 6. Thay đổi frontend

Khoảng **47 chỗ** trong `client/src` giả định ID là số. Quy tắc sửa:

| Hiện tại | Sau chuyển đổi |
|---|---|
| `Number(folderId)`, `parseInt(id)` | Giữ nguyên chuỗi |
| `Number(b.id) - Number(a.id)` (sắp xếp) | `new Date(b.createdAt) - new Date(a.createdAt)` hoặc `sortOrder` |
| `id === 5`, `id > 0` | `id === otherId`, `Boolean(id)` |
| Lưu ID vào `localStorage` (`reading_list_custom_order`) | Xóa dữ liệu cũ khi phát hiện ID dạng số; chuyển dần sang backend (FE-07) |
| Cursor phân trang dạng số | Chuỗi, truyền nguyên vẹn |

**Cách rà soát:**
```bash
grep -rnE "Number\(|parseInt\(|\.id\s*[-<>]|id\s*===\s*[0-9]" client/src
```
Nên làm sau FE-04 (tách custom hook) nếu có thể, vì khi đó phần lớn thao tác ID tập trung ở lớp API.

---

## 7. Kiểm thử

| Loại | Nội dung |
|---|---|
| Integration test (Testcontainers MongoDB) | Đăng ký/OTP/đăng nhập; CRUD vocab với cây lồng; tìm kiếm + lọc + cursor; đếm theo danh mục/danh sách; reorder; xóa dây chuyền |
| **Test cô lập dữ liệu** | User B không đọc, sửa, xóa, gán được Category/NoteList/Vocab của user A (kể cả khi truyền ID của A vào `categoryIds`) |
| Test regex an toàn | Từ khóa chứa `.*`, `(`, `\` không gây lỗi hay chậm |
| Test ID sai định dạng | `/vocabularies/abc` → 404, không phải 500 |
| Test công cụ migrate | Chạy trên dump nhỏ, khớp bảng đối chiếu mục 5.3 |

---

## 8. Triển khai và phương án quay lui

1. Hoàn thành M0–M7 trên nhánh `feature/mongodb`.
2. Dừng ghi trên hệ thống cũ (tắt backend), `mysqldump` lần cuối.
3. Chạy công cụ migrate vào Atlas, kiểm tra báo cáo đối chiếu.
4. Deploy backend mới với `MONGODB_URI`, deploy frontend.
5. Chạy checklist mục 9 trên môi trường thật.
6. **Quay lui (nếu lỗi nghiêm trọng):** checkout tag `before-mongodb`, deploy lại, MySQL vẫn còn nguyên. Dữ liệu tạo mới trên Mongo trong thời gian chạy sẽ không tự về MySQL. Vì vậy giữ thời gian theo dõi ngắn và chỉ gỡ MySQL sau 2 tuần ổn định (M8-02).

---

## 9. Checklist chấp nhận (Definition of Done)

- [ ] Đăng ký bằng OTP, đăng nhập, xem/sửa hồ sơ
- [ ] Thêm từ có nhiều form, nhiều sense, nhiều ví dụ; sửa; xóa một sense; xóa từ
- [ ] Thêm cùng một từ với hai từ loại khác nhau (`good (adj)`, `good (n)`)
- [ ] Master List: tìm kiếm tiếng Anh/tiếng Việt, lọc từ loại, lọc danh mục, cuộn tải thêm (cursor)
- [ ] Word Families: tạo, gom thành viên, đổi thứ tự
- [ ] Category: tạo, đổi tên (không cho trùng hoa/thường), xóa, số từ hiển thị đúng
- [ ] Thư mục và danh sách đọc: tạo, kéo thả sắp xếp, chuyển thư mục, xóa
- [ ] Bài đọc: thêm/sửa nội dung TipTap, highlight từ vựng
- [ ] Hồ sơ: heatmap, biểu đồ năng lực hiển thị đúng
- [ ] ESLint không phát sinh lỗi mới; toàn bộ test backend xanh
- [ ] Không còn tham chiếu JPA/MySQL trong code (sau M8-02)

---

## 10. Rủi ro và cách giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Frontend còn sót chỗ coi ID là số, gây lỗi lặt vặt | Cao | Rà bằng grep + checklist mục 9; TypeScript hoặc JSDoc cho kiểu ID về sau |
| `note_lists` vượt 16 MB do nhiều bài đọc dài | Thấp | Theo dõi kích thước; phương án dự phòng tách `reading_passages` thành collection riêng có `noteListId` |
| Quên xóa dây chuyền, sinh ID "mồ côi" trong mảng | Trung bình | Gom logic vào service + transaction + test; khi đọc, bỏ qua ID không còn tồn tại |
| Tìm kiếm regex chậm khi dữ liệu lớn | Thấp (dữ liệu cá nhân) | Index theo `userId` thu hẹp phạm vi; nâng cấp Atlas Search khi cần |
| Mất dữ liệu khi migrate | Trung bình | Sao lưu trước; công cụ chạy lại được; đối chiếu số lượng bắt buộc |
| Transaction không chạy ở môi trường dev | Trung bình | Chạy Mongo local dạng replica set (`--replSet rs0`) |
| Hai bản ghi trùng tên danh mục khác hoa/thường trong dữ liệu cũ, unique index thất bại | Trung bình | Công cụ migrate phát hiện và gộp, hoặc báo lỗi để xử lý tay |

---

## 11. Quyết định đã chốt

| Ngày | Quyết định | Lý do |
|---|---|---|
| 21/11/2026 | Dùng **ObjectId** thay vì ID số tự tăng | Chuẩn MongoDB và mô hình doanh nghiệp; sinh ID không cần DB, hỗ trợ app iOS tạo dữ liệu offline; không lộ quy mô dữ liệu và không đoán được ID kế tiếp. Mã nghiệp vụ dễ đọc giữ bằng trường `code` sẵn có |
| 21/11/2026 | Nhúng forms/senses/examples và passages; tham chiếu Category/NoteList/WordFamily | Theo nguyên tắc mục 3.2 |
| 21/11/2026 | Giữ nguyên hợp đồng API (đường dẫn, cấu trúc JSON) | Giảm phạm vi sửa frontend và app mobile sau này |

---

## 12. Nhật ký thay đổi

| Ngày | Hạng mục | Mô tả | Commit |
|---|---|---|---|
| 21/11/2026 | — | Lập kế hoạch chuyển đổi ban đầu | — |
