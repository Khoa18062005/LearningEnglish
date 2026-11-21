package com.dolvocab.app.repository;

import com.dolvocab.app.entity.Category;
import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class VocabularyQueryRepositoryImpl implements VocabularyQueryRepository {

    private final MongoTemplate mongoTemplate;

    @Override
    public List<Vocabulary> findVocabulariesWithFilter(
            String userId,
            String cursor,
            String keyword,
            List<String> categoryIds,
            String categoryName,
            String noteListId,
            PartOfSpeech pos,
            String wordFamilyId,
            int limit) {

        List<Criteria> andCriteria = new ArrayList<>();

        // 1. Phân quyền người dùng (Scoping to authenticated user)
        if (userId != null && ObjectId.isValid(userId)) {
            andCriteria.add(Criteria.where("userId").is(new ObjectId(userId)));
        }

        // 2. Phân trang Keyset Cursor (_id < cursor)
        if (cursor != null && !cursor.isBlank() && ObjectId.isValid(cursor)) {
            andCriteria.add(Criteria.where("_id").lt(new ObjectId(cursor)));
        }

        // 3. Lọc theo danh sách Category IDs
        if (categoryIds != null && !categoryIds.isEmpty()) {
            List<ObjectId> validCatIds = categoryIds.stream()
                    .filter(ObjectId::isValid)
                    .map(ObjectId::new)
                    .toList();
            if (!validCatIds.isEmpty()) {
                andCriteria.add(Criteria.where("categoryIds").in(validCatIds));
            }
        }

        // 4. Lọc theo tên Category (nếu truyền categoryName)
        if (categoryName != null && !categoryName.trim().isEmpty() && !categoryName.equalsIgnoreCase("all")) {
            String nameLower = categoryName.trim().toLowerCase();
            Query catQuery = new Query(Criteria.where("userId").is(new ObjectId(userId)).and("nameLower").is(nameLower));
            Category cat = mongoTemplate.findOne(catQuery, Category.class);
            if (cat != null) {
                andCriteria.add(Criteria.where("categoryIds").is(new ObjectId(cat.getId())));
            } else {
                // Tên danh mục không tồn tại -> trả về rỗng ngay
                return Collections.emptyList();
            }
        }

        // 5. Lọc theo NoteList ID
        if (noteListId != null && !noteListId.isBlank() && ObjectId.isValid(noteListId)) {
            andCriteria.add(Criteria.where("noteListIds").is(new ObjectId(noteListId)));
        }

        // 6. Lọc theo WordFamily ID
        if (wordFamilyId != null && !wordFamilyId.isBlank() && ObjectId.isValid(wordFamilyId)) {
            andCriteria.add(Criteria.where("wordFamilyId").is(new ObjectId(wordFamilyId)));
        }

        // 7. Lọc theo Từ loại (PartOfSpeech)
        if (pos != null) {
            String posName = pos.name();
            String posLower = posName.toLowerCase();
            String shortBadge = switch (pos) {
                case N -> "n";
                case V -> "v";
                case ADJ -> "adj";
                case ADV -> "adv";
                case PHRASAL_VERB -> "phrasal_verb";
                case IDIOM -> "idiom";
                case COLLOCATION -> "collocation";
                default -> posLower;
            };

            Criteria posCriteria = new Criteria().orOperator(
                    Criteria.where("forms.partOfSpeech").is(posName),
                    Criteria.where("pos").regex("^" + Pattern.quote(posLower) + "$", "i"),
                    Criteria.where("pos").regex("^" + Pattern.quote(shortBadge) + "$", "i")
            );
            andCriteria.add(posCriteria);
        }

        // 8. Tìm kiếm từ khóa (Keyword) - bắt buộc Pattern.quote để chống ReDoS / Injection
        if (keyword != null && !keyword.trim().isEmpty()) {
            String quoted = Pattern.quote(keyword.trim());
            Criteria keywordCriteria = new Criteria().orOperator(
                    Criteria.where("word").regex(quoted, "i"),
                    Criteria.where("meaning").regex(quoted, "i"),
                    Criteria.where("forms.senses.vietnameseMeaning").regex(quoted, "i"),
                    Criteria.where("forms.senses.collocation").regex(quoted, "i"),
                    Criteria.where("forms.senses.pattern").regex(quoted, "i"),
                    Criteria.where("forms.senses.synonyms").regex(quoted, "i")
            );
            andCriteria.add(keywordCriteria);
        }

        Query query = new Query();
        if (!andCriteria.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(andCriteria.toArray(new Criteria[0])));
        }

        query.with(Sort.by(Sort.Direction.DESC, "_id"));
        if (limit > 0) {
            query.limit(limit);
        }

        return mongoTemplate.find(query, Vocabulary.class);
    }

    @Override
    public Map<String, Long> countVocabulariesGroupedByCategoryIds(String userId) {
        if (userId == null || !ObjectId.isValid(userId)) {
            return Collections.emptyMap();
        }

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("userId").is(new ObjectId(userId))),
                Aggregation.unwind("categoryIds"),
                Aggregation.group("categoryIds").count().as("vocabCount")
        );

        AggregationResults<Document> results = mongoTemplate.aggregate(aggregation, "vocabularies", Document.class);
        Map<String, Long> countMap = new HashMap<>();
        for (Document doc : results) {
            Object idObj = doc.get("_id");
            if (idObj != null) {
                String catId = idObj.toString();
                Number count = (Number) doc.get("vocabCount");
                countMap.put(catId, count != null ? count.longValue() : 0L);
            }
        }
        return countMap;
    }

    @Override
    public Map<String, Long> countVocabulariesGroupedByNoteListIds(String userId) {
        if (userId == null || !ObjectId.isValid(userId)) {
            return Collections.emptyMap();
        }

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("userId").is(new ObjectId(userId))),
                Aggregation.unwind("noteListIds"),
                Aggregation.group("noteListIds").count().as("vocabCount")
        );

        AggregationResults<Document> results = mongoTemplate.aggregate(aggregation, "vocabularies", Document.class);
        Map<String, Long> countMap = new HashMap<>();
        for (Document doc : results) {
            Object idObj = doc.get("_id");
            if (idObj != null) {
                String noteListId = idObj.toString();
                Number count = (Number) doc.get("vocabCount");
                countMap.put(noteListId, count != null ? count.longValue() : 0L);
            }
        }
        return countMap;
    }
}
