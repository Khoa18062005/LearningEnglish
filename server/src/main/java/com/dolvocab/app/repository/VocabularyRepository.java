package com.dolvocab.app.repository;

import com.dolvocab.app.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, Long>, JpaSpecificationExecutor<Vocabulary> {

    List<Vocabulary> findAllByUserId(Long userId);

    Optional<Vocabulary> findByIdAndUserId(Long id, Long userId);

    Optional<Vocabulary> findByWordIgnoreCaseAndUserId(String word, Long userId);

    boolean existsByWordIgnoreCaseAndUserId(String word, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);

    void deleteByIdAndUserId(Long id, Long userId);
}
