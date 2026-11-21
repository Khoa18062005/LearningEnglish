package com.dolvocab.app.repository;

import com.dolvocab.app.entity.Vocabulary;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository extends MongoRepository<Vocabulary, String>, VocabularyQueryRepository {

    List<Vocabulary> findAllByUserId(String userId);

    Optional<Vocabulary> findByIdAndUserId(String id, String userId);

    List<Vocabulary> findAllByWordLowerAndUserId(String wordLower, String userId);

    Optional<Vocabulary> findFirstByWordLowerAndUserId(String wordLower, String userId);

    Optional<Vocabulary> findByWordLowerAndUserId(String wordLower, String userId);

    Optional<Vocabulary> findByWordLowerAndPosIgnoreCaseAndUserId(String wordLower, String pos, String userId);

    boolean existsByWordLowerAndUserId(String wordLower, String userId);

    boolean existsByIdAndUserId(String id, String userId);

    void deleteByIdAndUserId(String id, String userId);

    // Default methods tương thích ngược
    default List<Vocabulary> findAllByWordIgnoreCaseAndUserId(String word, String userId) {
        return findAllByWordLowerAndUserId(word != null ? word.trim().toLowerCase() : null, userId);
    }

    default Optional<Vocabulary> findFirstByWordIgnoreCaseAndUserId(String word, String userId) {
        return findFirstByWordLowerAndUserId(word != null ? word.trim().toLowerCase() : null, userId);
    }

    default Optional<Vocabulary> findByWordIgnoreCaseAndUserId(String word, String userId) {
        return findByWordLowerAndUserId(word != null ? word.trim().toLowerCase() : null, userId);
    }

    default Optional<Vocabulary> findByWordIgnoreCaseAndPosIgnoreCaseAndUserId(String word, String pos, String userId) {
        return findByWordLowerAndPosIgnoreCaseAndUserId(
                word != null ? word.trim().toLowerCase() : null,
                pos != null ? pos.trim().toLowerCase() : null,
                userId
        );
    }

    default boolean existsByWordIgnoreCaseAndUserId(String word, String userId) {
        return existsByWordLowerAndUserId(word != null ? word.trim().toLowerCase() : null, userId);
    }
}
