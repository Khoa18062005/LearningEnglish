package com.dolvocab.app.repository;

import com.dolvocab.app.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByUserIdOrderByNameAsc(Long userId);

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    Optional<Category> findByNameIgnoreCaseAndUserId(String name, Long userId);

    boolean existsByNameIgnoreCaseAndUserId(String name, Long userId);

    @Query("SELECT c.id, c.name, c.colorCode, c.description, COUNT(v.id) " +
           "FROM Category c LEFT JOIN c.vocabularies v " +
           "WHERE c.user.id = :userId " +
           "GROUP BY c.id, c.name, c.colorCode, c.description " +
           "ORDER BY c.name ASC")
    List<Object[]> findCategoriesWithVocabCountByUserId(@Param("userId") Long userId);
}
