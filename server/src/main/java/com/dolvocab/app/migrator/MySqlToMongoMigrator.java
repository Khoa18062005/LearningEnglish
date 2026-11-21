package com.dolvocab.app.migrator;

import com.dolvocab.app.entity.*;
import com.dolvocab.app.entity.enums.Countability;
import com.dolvocab.app.entity.enums.Gender;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import com.dolvocab.app.entity.enums.Role;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Component
@Profile("migrate")
@RequiredArgsConstructor
@Slf4j
public class MySqlToMongoMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final MongoTemplate mongoTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private ObjectId generateObjectId(LocalDateTime ldt) {
        if (ldt != null) {
            Instant instant = ldt.atZone(ZoneId.systemDefault()).toInstant();
            return new ObjectId(Date.from(instant));
        }
        return new ObjectId();
    }

    private LocalDateTime toLdt(Timestamp ts) {
        return ts != null ? ts.toLocalDateTime() : null;
    }

    @Override
    public void run(String... args) {
        log.info("===============================================================");
        log.info("   BẮT ĐẦU QUY TRÌNH DI CHUYỂN CSDL: MySQL -> MongoDB");
        log.info("===============================================================");

        Map<Long, ObjectId> userIdMap = new HashMap<>();
        Map<Long, ObjectId> catIdMap = new HashMap<>();
        Map<Long, ObjectId> wfIdMap = new HashMap<>();
        Map<Long, ObjectId> folderIdMap = new HashMap<>();
        Map<Long, ObjectId> noteListIdMap = new HashMap<>();
        Map<Long, ObjectId> vocabIdMap = new HashMap<>();

        try {
            // 0. Xóa sạch dữ liệu các collection đích trong MongoDB trước khi chuyển
            log.info("Dọn dẹp các collection cũ trên MongoDB...");
            mongoTemplate.dropCollection("users");
            mongoTemplate.dropCollection("categories");
            mongoTemplate.dropCollection("word_families");
            mongoTemplate.dropCollection("note_folders");
            mongoTemplate.dropCollection("note_lists");
            mongoTemplate.dropCollection("vocabularies");
            mongoTemplate.dropCollection("otp_verifications");

            // 1. Chuyển USERS
            log.info("1/6 Đang chuyển bảng 'users'...");
            jdbcTemplate.query("SELECT * FROM users", rs -> {
                Long oldId = rs.getLong("id");
                LocalDateTime createdAt = toLdt(rs.getTimestamp("created_at"));
                LocalDateTime updatedAt = toLdt(rs.getTimestamp("updated_at"));
                ObjectId newId = generateObjectId(createdAt);
                userIdMap.put(oldId, newId);

                java.sql.Date dob = rs.getDate("date_of_birth");
                LocalDate dateOfBirth = dob != null ? dob.toLocalDate() : null;

                String genderStr = rs.getString("gender");
                Gender gender = Gender.OTHER;
                if (genderStr != null) {
                    try { gender = Gender.valueOf(genderStr); } catch (Exception ignored) {}
                }

                String roleStr = rs.getString("role");
                Role role = Role.ROLE_USER;
                if (roleStr != null) {
                    try { role = Role.valueOf(roleStr); } catch (Exception ignored) {}
                }

                User.Address address = User.Address.builder()
                        .provinceCode((Integer) rs.getObject("province_code"))
                        .provinceName(rs.getString("province_name"))
                        .wardCode((Integer) rs.getObject("ward_code"))
                        .wardName(rs.getString("ward_name"))
                        .detail(rs.getString("address_detail"))
                        .build();

                User user = User.builder()
                        .id(newId.toHexString())
                        .email(rs.getString("email"))
                        .password(rs.getString("password"))
                        .fullName(rs.getString("full_name"))
                        .dateOfBirth(dateOfBirth)
                        .gender(gender)
                        .address(address)
                        .role(role)
                        .createdAt(createdAt)
                        .updatedAt(updatedAt)
                        .build();

                mongoTemplate.save(user, "users");
            });
            log.info("   -> Đã chuyển {} users.", userIdMap.size());

            // 2. Chuyển CATEGORIES
            log.info("2/6 Đang chuyển bảng 'categories'...");
            jdbcTemplate.query("SELECT * FROM categories", rs -> {
                Long oldId = rs.getLong("id");
                Long oldUserId = rs.getLong("user_id");
                ObjectId newUserId = userIdMap.get(oldUserId);
                if (newUserId == null) return;

                LocalDateTime createdAt = toLdt(rs.getTimestamp("created_at"));
                ObjectId newId = generateObjectId(createdAt);
                catIdMap.put(oldId, newId);

                String name = rs.getString("name");
                String nameLower = name != null ? name.trim().toLowerCase() : "";

                Category cat = Category.builder()
                        .id(newId.toHexString())
                        .userId(newUserId.toHexString())
                        .name(name)
                        .nameLower(nameLower)
                        .colorCode(rs.getString("color_code"))
                        .description(rs.getString("description"))
                        .createdAt(createdAt)
                        .build();

                mongoTemplate.save(cat, "categories");
            });
            log.info("   -> Đã chuyển {} categories.", catIdMap.size());

            // 3. Chuyển WORD_FAMILIES
            log.info("3/6 Đang chuyển bảng 'word_families'...");
            jdbcTemplate.query("SELECT * FROM word_families", rs -> {
                Long oldId = rs.getLong("id");
                Long oldUserId = rs.getLong("user_id");
                ObjectId newUserId = userIdMap.get(oldUserId);
                if (newUserId == null) return;

                LocalDateTime createdAt = toLdt(rs.getTimestamp("created_at"));
                ObjectId newId = generateObjectId(createdAt);
                wfIdMap.put(oldId, newId);

                String rootWord = rs.getString("root_word");
                String rootWordLower = rootWord != null ? rootWord.trim().toLowerCase() : "";

                WordFamily wf = WordFamily.builder()
                        .id(newId.toHexString())
                        .userId(newUserId.toHexString())
                        .rootWord(rootWord)
                        .rootWordLower(rootWordLower)
                        .description(rs.getString("description"))
                        .createdAt(createdAt)
                        .build();

                mongoTemplate.save(wf, "word_families");
            });
            log.info("   -> Đã chuyển {} word_families.", wfIdMap.size());

            // 4. Chuyển NOTE_FOLDERS
            log.info("4/6 Đang chuyển bảng 'note_folders'...");
            jdbcTemplate.query("SELECT * FROM note_folders", rs -> {
                Long oldId = rs.getLong("id");
                Long oldUserId = rs.getLong("user_id");
                ObjectId newUserId = userIdMap.get(oldUserId);
                if (newUserId == null) return;

                LocalDateTime createdAt = toLdt(rs.getTimestamp("created_at"));
                ObjectId newId = generateObjectId(createdAt);
                folderIdMap.put(oldId, newId);

                Integer sortOrder = (Integer) rs.getObject("sort_order");

                NoteFolder folder = NoteFolder.builder()
                        .id(newId.toHexString())
                        .userId(newUserId.toHexString())
                        .code(rs.getString("code"))
                        .name(rs.getString("name"))
                        .description(rs.getString("description"))
                        .sortOrder(sortOrder != null ? sortOrder : 0)
                        .createdAt(createdAt)
                        .build();

                mongoTemplate.save(folder, "note_folders");
            });
            log.info("   -> Đã chuyển {} note_folders.", folderIdMap.size());

            // 5. Chuyển NOTE_LISTS và READING_PASSAGES (nhúng)
            log.info("5/6 Đang chuyển bảng 'note_lists' và nhúng 'reading_passages'...");
            Map<Long, List<ReadingPassage>> passagesMap = new HashMap<>();
            jdbcTemplate.query("SELECT * FROM reading_passages ORDER BY COALESCE(sort_order, 999999) ASC, id ASC", rs -> {
                Long listId = rs.getLong("note_list_id");
                LocalDateTime createdAt = toLdt(rs.getTimestamp("created_at"));
                LocalDateTime updatedAt = toLdt(rs.getTimestamp("updated_at"));
                ObjectId pid = generateObjectId(createdAt);

                ReadingPassage rp = ReadingPassage.builder()
                        .id(pid.toHexString())
                        .title(rs.getString("title"))
                        .content(rs.getString("content"))
                        .wordCount((Integer) rs.getObject("word_count"))
                        .sortOrder((Integer) rs.getObject("sort_order"))
                        .createdAt(createdAt)
                        .updatedAt(updatedAt)
                        .build();

                passagesMap.computeIfAbsent(listId, k -> new ArrayList<>()).add(rp);
            });

            jdbcTemplate.query("SELECT * FROM note_lists", rs -> {
                Long oldId = rs.getLong("id");
                Long oldUserId = rs.getLong("user_id");
                ObjectId newUserId = userIdMap.get(oldUserId);
                if (newUserId == null) return;

                Long oldFolderId = (Long) rs.getObject("folder_id");
                ObjectId newFolderId = oldFolderId != null ? folderIdMap.get(oldFolderId) : null;

                LocalDateTime createdAt = toLdt(rs.getTimestamp("created_at"));
                ObjectId newId = generateObjectId(createdAt);
                noteListIdMap.put(oldId, newId);

                String code = rs.getString("code");
                String codeLower = code != null ? code.trim().toLowerCase() : null;
                Integer sortOrder = (Integer) rs.getObject("sort_order");

                List<ReadingPassage> passages = passagesMap.getOrDefault(oldId, new ArrayList<>());

                NoteList noteList = NoteList.builder()
                        .id(newId.toHexString())
                        .userId(newUserId.toHexString())
                        .folderId(newFolderId != null ? newFolderId.toHexString() : null)
                        .title(rs.getString("title"))
                        .code(code)
                        .codeLower(codeLower)
                        .sourceReference(rs.getString("source_reference"))
                        .passage(rs.getString("passage"))
                        .note(rs.getString("note"))
                        .sortOrder(sortOrder != null ? sortOrder : 0)
                        .passages(passages)
                        .createdAt(createdAt)
                        .build();

                mongoTemplate.save(noteList, "note_lists");
            });
            log.info("   -> Đã chuyển {} note_lists.", noteListIdMap.size());

            // 6. Chuyển VOCABULARIES (nhúng forms, senses, examples + categoryIds, noteListIds)
            log.info("6/6 Đang chuyển 'vocabularies' và các tầng con lồng ghép...");

            // Bảng nối vocab_categories: vocab_id -> List<catId>
            Map<Long, List<String>> vocabCatMap = new HashMap<>();
            jdbcTemplate.query("SELECT * FROM vocab_categories", rs -> {
                Long vId = rs.getLong("vocab_id");
                Long cId = rs.getLong("category_id");
                ObjectId newCatId = catIdMap.get(cId);
                if (newCatId != null) {
                    vocabCatMap.computeIfAbsent(vId, k -> new ArrayList<>()).add(newCatId.toHexString());
                }
            });

            // Bảng nối note_list_vocabs: vocab_id -> List<noteListId>
            Map<Long, List<String>> vocabListMap = new HashMap<>();
            jdbcTemplate.query("SELECT * FROM note_list_vocabs", rs -> {
                Long vId = rs.getLong("vocab_id");
                Long lId = rs.getLong("note_list_id");
                ObjectId newListId = noteListIdMap.get(lId);
                if (newListId != null) {
                    vocabListMap.computeIfAbsent(vId, k -> new ArrayList<>()).add(newListId.toHexString());
                }
            });

            // Load examples: sense_id -> List<VocabExample>
            Map<Long, List<VocabExample>> examplesMap = new HashMap<>();
            jdbcTemplate.query("SELECT * FROM vocab_examples", rs -> {
                Long senseId = rs.getLong("vocab_sense_id");
                VocabExample ex = VocabExample.builder()
                        .id(new ObjectId().toHexString())
                        .exampleSentence(rs.getString("example_sentence"))
                        .exampleTranslation(rs.getString("example_translation"))
                        .build();
                examplesMap.computeIfAbsent(senseId, k -> new ArrayList<>()).add(ex);
            });

            // Load senses: form_id -> List<VocabSense>
            Map<Long, List<VocabSense>> sensesMap = new HashMap<>();
            jdbcTemplate.query("SELECT * FROM vocab_senses ORDER BY COALESCE(display_order, 1) ASC, id ASC", rs -> {
                Long oldSenseId = rs.getLong("id");
                Long formId = rs.getLong("vocab_form_id");

                List<VocabExample> examples = examplesMap.getOrDefault(oldSenseId, new ArrayList<>());

                VocabSense sense = VocabSense.builder()
                        .id(new ObjectId().toHexString())
                        .pattern(rs.getString("pattern"))
                        .collocation(rs.getString("collocation"))
                        .synonyms(rs.getString("synonyms"))
                        .closeMeanings(rs.getString("close_meanings"))
                        .vietnameseMeaning(rs.getString("vietnamese_meaning"))
                        .usageNote(rs.getString("usage_note"))
                        .displayOrder((Integer) rs.getObject("display_order"))
                        .examples(examples)
                        .build();

                sensesMap.computeIfAbsent(formId, k -> new ArrayList<>()).add(sense);
            });

            // Load forms: vocab_id -> List<VocabForm>
            Map<Long, List<VocabForm>> formsMap = new HashMap<>();
            jdbcTemplate.query("SELECT * FROM vocab_forms ORDER BY COALESCE(display_order, 1) ASC, id ASC", rs -> {
                Long oldFormId = rs.getLong("id");
                Long vocabId = rs.getLong("vocab_id");

                String posStr = rs.getString("part_of_speech");
                PartOfSpeech pos = PartOfSpeech.V;
                if (posStr != null) {
                    try { pos = PartOfSpeech.valueOf(posStr); } catch (Exception ignored) {}
                }

                String cntStr = rs.getString("countability");
                Countability countability = Countability.NOT_APPLICABLE;
                if (cntStr != null) {
                    try { countability = Countability.valueOf(cntStr); } catch (Exception ignored) {}
                }

                List<VocabSense> senses = sensesMap.getOrDefault(oldFormId, new ArrayList<>());

                VocabForm form = VocabForm.builder()
                        .id(new ObjectId().toHexString())
                        .partOfSpeech(pos)
                        .countability(countability)
                        .displayOrder((Integer) rs.getObject("display_order"))
                        .senses(senses)
                        .build();

                formsMap.computeIfAbsent(vocabId, k -> new ArrayList<>()).add(form);
            });

            // Ghi vocabularies
            jdbcTemplate.query("SELECT * FROM vocabularies", rs -> {
                Long oldId = rs.getLong("id");
                Long oldUserId = rs.getLong("user_id");
                ObjectId newUserId = userIdMap.get(oldUserId);
                if (newUserId == null) return;

                Long oldWfId = (Long) rs.getObject("word_family_id");
                ObjectId newWfId = oldWfId != null ? wfIdMap.get(oldWfId) : null;

                LocalDateTime createdAt = toLdt(rs.getTimestamp("created_at"));
                LocalDateTime updatedAt = toLdt(rs.getTimestamp("updated_at"));
                ObjectId newId = generateObjectId(createdAt);
                vocabIdMap.put(oldId, newId);

                String word = rs.getString("word");
                String wordLower = word != null ? word.trim().toLowerCase() : "";

                String meaningDetailsJson = rs.getString("meaning_details_json");
                List<Object> meaningDetails = new ArrayList<>();
                if (meaningDetailsJson != null && !meaningDetailsJson.trim().isEmpty()) {
                    try {
                        List<Object> parsed = objectMapper.readValue(meaningDetailsJson, new TypeReference<List<Object>>() {});
                        if (parsed != null) meaningDetails.addAll(parsed);
                    } catch (Exception ignored) {}
                }

                List<VocabForm> forms = formsMap.getOrDefault(oldId, new ArrayList<>());
                List<String> categoryIds = vocabCatMap.getOrDefault(oldId, new ArrayList<>());
                List<String> noteListIds = vocabListMap.getOrDefault(oldId, new ArrayList<>());

                Vocabulary vocab = Vocabulary.builder()
                        .id(newId.toHexString())
                        .userId(newUserId.toHexString())
                        .word(word)
                        .wordLower(wordLower)
                        .pos(rs.getString("pos"))
                        .phonetic(rs.getString("phonetic"))
                        .audioUrl(rs.getString("audio_url"))
                        .wordFamilyId(newWfId != null ? newWfId.toHexString() : null)
                        .generalNote(rs.getString("general_note"))
                        .meaning(rs.getString("meaning"))
                        .closeMeanings(rs.getString("close_meanings"))
                        .synonyms(rs.getString("synonyms"))
                        .meaningDetailsJson(meaningDetailsJson)
                        .meaningDetails(meaningDetails)
                        .categoryIds(categoryIds)
                        .noteListIds(noteListIds)
                        .forms(forms)
                        .createdAt(createdAt)
                        .updatedAt(updatedAt)
                        .build();

                mongoTemplate.save(vocab, "vocabularies");
            });
            log.info("   -> Đã chuyển {} vocabularies.", vocabIdMap.size());

            // 7. Cập nhật lại memberOrder trong word_families
            log.info("Đang đồng bộ memberOrder cho Word Families...");
            jdbcTemplate.query("SELECT id, member_order FROM word_families WHERE member_order IS NOT NULL", rs -> {
                Long oldWfId = rs.getLong("id");
                String rawOrder = rs.getString("member_order");
                ObjectId newWfId = wfIdMap.get(oldWfId);
                if (newWfId != null && rawOrder != null && !rawOrder.trim().isEmpty()) {
                    String[] oldIds = rawOrder.split(",");
                    List<String> newOrder = new ArrayList<>();
                    for (String strId : oldIds) {
                        try {
                            Long oldVid = Long.parseLong(strId.trim());
                            ObjectId newVid = vocabIdMap.get(oldVid);
                            if (newVid != null) {
                                newOrder.add(newVid.toHexString());
                            }
                        } catch (Exception ignored) {
                            newOrder.add(strId.trim());
                        }
                    }
                    WordFamily wf = mongoTemplate.findById(newWfId.toHexString(), WordFamily.class);
                    if (wf != null) {
                        wf.setMemberOrder(newOrder);
                        mongoTemplate.save(wf, "word_families");
                    }
                }
            });

            log.info("===============================================================");
            log.info("   KẾT QUẢ ĐỐI CHIẾU DỮ LIỆU:");
            log.info("   - Users: {} -> {}", userIdMap.size(), mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(), "users"));
            log.info("   - Categories: {} -> {}", catIdMap.size(), mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(), "categories"));
            log.info("   - Word Families: {} -> {}", wfIdMap.size(), mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(), "word_families"));
            log.info("   - Note Folders: {} -> {}", folderIdMap.size(), mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(), "note_folders"));
            log.info("   - Note Lists: {} -> {}", noteListIdMap.size(), mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(), "note_lists"));
            log.info("   - Vocabularies: {} -> {}", vocabIdMap.size(), mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(), "vocabularies"));
            log.info("===============================================================");
            log.info("   CHUYỂN ĐỔI DỮ LIỆU HOÀN TẤT THÀNH CÔNG RỰC RỠ!");
            log.info("===============================================================");

        } catch (Exception e) {
            log.error("LỖI TRONG QUÁ TRÌNH MIGRATE DỮ LIỆU: ", e);
            throw new RuntimeException("Migration thất bại: " + e.getMessage(), e);
        }
    }
}
