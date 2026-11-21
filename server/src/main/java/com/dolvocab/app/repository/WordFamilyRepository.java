package com.dolvocab.app.repository;

import com.dolvocab.app.entity.WordFamily;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WordFamilyRepository extends MongoRepository<WordFamily, String> {

    List<WordFamily> findAllByUserIdOrderByRootWordAsc(String userId);

    Optional<WordFamily> findByIdAndUserId(String id, String userId);

    Optional<WordFamily> findByRootWordLowerAndUserId(String rootWordLower, String userId);

    boolean existsByRootWordLowerAndUserId(String rootWordLower, String userId);

    boolean existsByIdAndUserId(String id, String userId);

    default Optional<WordFamily> findByRootWordIgnoreCaseAndUserId(String rootWord, String userId) {
        return findByRootWordLowerAndUserId(rootWord != null ? rootWord.trim().toLowerCase() : null, userId);
    }

    default boolean existsByRootWordIgnoreCaseAndUserId(String rootWord, String userId) {
        return existsByRootWordLowerAndUserId(rootWord != null ? rootWord.trim().toLowerCase() : null, userId);
    }
}
