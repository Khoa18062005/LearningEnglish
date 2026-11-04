package com.dolvocab.app.repository;

import com.dolvocab.app.entity.NoteFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteFolderRepository extends JpaRepository<NoteFolder, Long> {

    List<NoteFolder> findAllByUserIdOrderByIdAsc(Long userId);

    Optional<NoteFolder> findByIdAndUserId(Long id, Long userId);

    Optional<NoteFolder> findByCodeIgnoreCaseAndUserId(String code, Long userId);

    long countByUserId(Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
