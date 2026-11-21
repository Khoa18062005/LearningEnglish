package com.dolvocab.app.repository;

import com.dolvocab.app.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends MongoRepository<Category, String> {

    List<Category> findAllByUserIdOrderByNameAsc(String userId);

    Optional<Category> findByIdAndUserId(String id, String userId);

    Optional<Category> findByNameLowerAndUserId(String nameLower, String userId);

    boolean existsByNameLowerAndUserId(String nameLower, String userId);

    default Optional<Category> findByNameIgnoreCaseAndUserId(String name, String userId) {
        return findByNameLowerAndUserId(name != null ? name.trim().toLowerCase() : null, userId);
    }

    default boolean existsByNameIgnoreCaseAndUserId(String name, String userId) {
        return existsByNameLowerAndUserId(name != null ? name.trim().toLowerCase() : null, userId);
    }
}
