package com.dolvocab.app.repository;

import com.dolvocab.app.entity.WordFamily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WordFamilyRepository extends JpaRepository<WordFamily, Long> {

    Optional<WordFamily> findByRootWordIgnoreCase(String rootWord);

    boolean existsByRootWordIgnoreCase(String rootWord);
}
