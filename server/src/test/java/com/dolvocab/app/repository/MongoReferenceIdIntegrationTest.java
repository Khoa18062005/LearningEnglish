package com.dolvocab.app.repository;

import com.dolvocab.app.entity.VocabForm;
import com.dolvocab.app.entity.VocabSense;
import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.entity.WordFamily;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Kiểm thử với MongoDB thật (Testcontainers, replica set) cho hợp đồng kiểu dữ liệu:
 * các mảng tham chiếu (categoryIds, noteListIds, memberOrder) phải lưu dạng ObjectId
 * để khớp với truy vấn lọc và thao tác xóa dây chuyền ($pull).
 *
 * Cần Docker đang chạy; nếu không có Docker, lớp test này tự động được bỏ qua.
 */
@DataMongoTest
@Testcontainers(disabledWithoutDocker = true)
class MongoReferenceIdIntegrationTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    private final String userId = new ObjectId().toHexString();
    private final String otherUserId = new ObjectId().toHexString();
    private final String categoryId = new ObjectId().toHexString();
    private final String noteListId = new ObjectId().toHexString();

    @BeforeEach
    void cleanUp() {
        mongoTemplate.dropCollection(Vocabulary.class);
        mongoTemplate.dropCollection(WordFamily.class);
    }

    private Vocabulary saveVocab(String ownerId, String word) {
        VocabSense sense = VocabSense.builder().vietnameseMeaning("hợp đồng thuê").collocation("lease agreement").build();
        VocabForm form = VocabForm.builder().partOfSpeech(PartOfSpeech.N).senses(new java.util.ArrayList<>(List.of(sense))).build();
        Vocabulary vocab = Vocabulary.builder()
                .userId(ownerId)
                .word(word)
                .wordLower(word.toLowerCase())
                .categoryIds(new java.util.ArrayList<>(List.of(categoryId)))
                .noteListIds(new java.util.ArrayList<>(List.of(noteListId)))
                .forms(new java.util.ArrayList<>(List.of(form)))
                .build();
        return vocabularyRepository.save(vocab);
    }

    @Test
    @DisplayName("userId, categoryIds, noteListIds được lưu dạng ObjectId trong MongoDB")
    void referenceIdsAreStoredAsObjectId() {
        Vocabulary saved = saveVocab(userId, "lease");

        Document raw = mongoTemplate.getCollection("vocabularies")
                .find(new Document("_id", new ObjectId(saved.getId()))).first();

        assertThat(raw).isNotNull();
        assertThat(raw.get("userId")).isInstanceOf(ObjectId.class);
        assertThat(raw.getList("categoryIds", Object.class)).allMatch(ObjectId.class::isInstance);
        assertThat(raw.getList("noteListIds", Object.class)).allMatch(ObjectId.class::isInstance);

        // Đọc lại qua repository vẫn nhận về chuỗi hex
        Vocabulary reloaded = vocabularyRepository.findById(saved.getId()).orElseThrow();
        assertThat(reloaded.getCategoryIds()).containsExactly(categoryId);
        assertThat(reloaded.getNoteListIds()).containsExactly(noteListId);
    }

    @Test
    @DisplayName("Lọc theo danh sách đọc và danh mục trả về đúng từ vựng, đúng user")
    void filterByNoteListAndCategory() {
        saveVocab(userId, "lease");
        saveVocab(otherUserId, "lease");

        List<Vocabulary> byList = vocabularyRepository.findVocabulariesWithFilter(
                userId, null, null, null, null, noteListId, null, null, 0);
        List<Vocabulary> byCategory = vocabularyRepository.findVocabulariesWithFilter(
                userId, null, null, List.of(categoryId), null, null, null, null, 0);

        assertThat(byList).hasSize(1).allMatch(v -> v.getUserId().equals(userId));
        assertThat(byCategory).hasSize(1).allMatch(v -> v.getUserId().equals(userId));
    }

    @Test
    @DisplayName("Đếm số từ theo danh sách đọc và danh mục")
    void countGroupedByReferences() {
        saveVocab(userId, "lease");
        saveVocab(userId, "rent");

        Map<String, Long> byList = vocabularyRepository.countVocabulariesGroupedByNoteListIds(userId);
        Map<String, Long> byCategory = vocabularyRepository.countVocabulariesGroupedByCategoryIds(userId);

        assertThat(byList).containsEntry(noteListId, 2L);
        assertThat(byCategory).containsEntry(categoryId, 2L);
    }

    @Test
    @DisplayName("Tìm kiếm với ký tự đặc biệt của regex không gây lỗi")
    void keywordWithRegexCharactersIsSafe() {
        saveVocab(userId, "lease");

        assertThatCode(() -> vocabularyRepository.findVocabulariesWithFilter(
                userId, null, "(.*[", null, null, null, null, null, 0)).doesNotThrowAnyException();
        assertThat(vocabularyRepository.findVocabulariesWithFilter(
                userId, null, "agreement", null, null, null, null, null, 0)).hasSize(1);
    }

    @Test
    @DisplayName("$pull bằng ObjectId gỡ được ID khỏi categoryIds và noteListIds")
    void pullRemovesReferenceFromVocabularies() {
        Vocabulary saved = saveVocab(userId, "lease");
        Query byUser = Query.query(Criteria.where("userId").is(new ObjectId(userId)));

        mongoTemplate.updateMulti(byUser, new Update().pull("categoryIds", new ObjectId(categoryId)), Vocabulary.class);
        mongoTemplate.updateMulti(byUser, new Update().pull("noteListIds", new ObjectId(noteListId)), Vocabulary.class);

        Vocabulary reloaded = vocabularyRepository.findById(saved.getId()).orElseThrow();
        assertThat(reloaded.getCategoryIds()).isEmpty();
        assertThat(reloaded.getNoteListIds()).isEmpty();
    }

    @Test
    @DisplayName("$pull bằng ObjectId gỡ được vocab khỏi word_families.memberOrder")
    void pullRemovesVocabFromWordFamilyMemberOrder() {
        String removedVocabId = new ObjectId().toHexString();
        String keptVocabId = new ObjectId().toHexString();
        WordFamily wf = mongoTemplate.save(WordFamily.builder()
                .userId(userId)
                .rootWord("employ")
                .rootWordLower("employ")
                .memberOrder(new java.util.ArrayList<>(List.of(removedVocabId, keptVocabId)))
                .build());

        Document raw = mongoTemplate.getCollection("word_families")
                .find(new Document("_id", new ObjectId(wf.getId()))).first();
        assertThat(raw).isNotNull();
        assertThat(raw.getList("memberOrder", Object.class)).allMatch(ObjectId.class::isInstance);

        mongoTemplate.updateMulti(
                Query.query(Criteria.where("userId").is(new ObjectId(userId))),
                new Update().pull("memberOrder", new ObjectId(removedVocabId)),
                WordFamily.class);

        WordFamily reloaded = mongoTemplate.findById(wf.getId(), WordFamily.class);
        assertThat(reloaded).isNotNull();
        assertThat(reloaded.getMemberOrder()).containsExactly(keptVocabId);
    }
}
