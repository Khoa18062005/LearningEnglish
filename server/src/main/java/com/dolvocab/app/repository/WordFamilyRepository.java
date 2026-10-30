package com.dolvocab.app.repository;

import com.dolvocab.app.entity.WordFamily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WordFamilyRepository extends JpaRepository<WordFamily, Long> {

    List<WordFamily> findAllByUserIdOrderByRootWordAsc(Long userId);

    Optional<WordFamily> findByIdAndUserId(Long id, Long userId);

    Optional<WordFamily> findByRootWordIgnoreCaseAndUserId(String rootWord, Long userId);

    boolean existsByRootWordIgnoreCaseAndUserId(String rootWord, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
