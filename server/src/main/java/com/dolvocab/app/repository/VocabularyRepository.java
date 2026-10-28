package com.dolvocab.app.repository;

import com.dolvocab.app.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, Long>, JpaSpecificationExecutor<Vocabulary> {

    Optional<Vocabulary> findByWordIgnoreCase(String word);

    boolean existsByWordIgnoreCase(String word);
}
