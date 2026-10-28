package com.dolvocab.app.repository.specification;

import com.dolvocab.app.entity.*;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class VocabularySpecification {

    public static Specification<Vocabulary> filterVocabularies(
            String keyword,
            List<Long> categoryIds,
            String categoryName,
            Long noteListId,
            PartOfSpeech pos,
            Long wordFamilyId) {

        return (root, query, cb) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();

            // 1. Keyword search (word, pattern, collocation, vietnamese meaning, synonym)
            if (keyword != null && !keyword.trim().isEmpty()) {
                String searchPattern = "%" + keyword.trim().toLowerCase() + "%";

                Join<Vocabulary, VocabForm> formJoin = root.join("forms", JoinType.LEFT);
                Join<VocabForm, VocabSense> senseJoin = formJoin.join("senses", JoinType.LEFT);
                Join<Vocabulary, WordFamily> familyJoin = root.join("wordFamily", JoinType.LEFT);

                Predicate wordMatch = cb.like(cb.lower(root.get("word")), searchPattern);
                Predicate vocabMeaningMatch = cb.like(cb.lower(root.get("meaning")), searchPattern);
                Predicate meaningMatch = cb.like(cb.lower(senseJoin.get("vietnameseMeaning")), searchPattern);
                Predicate collocationMatch = cb.like(cb.lower(senseJoin.get("collocation")), searchPattern);
                Predicate patternMatch = cb.like(cb.lower(senseJoin.get("pattern")), searchPattern);
                Predicate synonymMatch = cb.like(cb.lower(senseJoin.get("synonyms")), searchPattern);
                Predicate familyMatch = cb.like(cb.lower(familyJoin.get("rootWord")), searchPattern);

                predicates.add(cb.or(wordMatch, vocabMeaningMatch, meaningMatch, collocationMatch, patternMatch, synonymMatch, familyMatch));
            }

            // 2. Filter by Category IDs
            if (categoryIds != null && !categoryIds.isEmpty()) {
                Join<Vocabulary, Category> categoryJoin = root.join("categories", JoinType.INNER);
                predicates.add(categoryJoin.get("id").in(categoryIds));
            }

            // 3. Filter by Category Name
            if (categoryName != null && !categoryName.trim().isEmpty() && !categoryName.equalsIgnoreCase("all")) {
                Join<Vocabulary, Category> categoryJoin = root.join("categories", JoinType.INNER);
                predicates.add(cb.equal(cb.lower(categoryJoin.get("name")), categoryName.trim().toLowerCase()));
            }

            // 4. Filter by Reading Note List
            if (noteListId != null) {
                Join<Vocabulary, NoteList> listJoin = root.join("noteLists", JoinType.INNER);
                predicates.add(cb.equal(listJoin.get("id"), noteListId));
            }

            // 5. Filter by Part of Speech
            if (pos != null) {
                Join<Vocabulary, VocabForm> formJoin = root.join("forms", JoinType.INNER);
                predicates.add(cb.equal(formJoin.get("partOfSpeech"), pos));
            }

            // 6. Filter by Word Family
            if (wordFamilyId != null) {
                predicates.add(cb.equal(root.get("wordFamily").get("id"), wordFamilyId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
