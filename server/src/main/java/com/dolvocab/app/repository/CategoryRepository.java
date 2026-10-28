package com.dolvocab.app.repository;

import com.dolvocab.app.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT c.id, c.name, c.colorCode, c.description, COUNT(v.id) " +
           "FROM Category c LEFT JOIN c.vocabularies v " +
           "GROUP BY c.id, c.name, c.colorCode, c.description " +
           "ORDER BY c.name ASC")
    List<Object[]> findCategoriesWithVocabCount();
}
