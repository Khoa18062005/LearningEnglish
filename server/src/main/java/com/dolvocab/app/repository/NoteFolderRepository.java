package com.dolvocab.app.repository;

import com.dolvocab.app.entity.NoteFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteFolderRepository extends JpaRepository<NoteFolder, Long> {

    @Query("SELECT f FROM NoteFolder f WHERE f.user.id = :userId ORDER BY COALESCE(f.sortOrder, 999999) ASC, f.id ASC")
    List<NoteFolder> findAllByUserIdOrdered(@Param("userId") Long userId);

    List<NoteFolder> findAllByUserIdOrderByIdAsc(Long userId);

    Optional<NoteFolder> findByIdAndUserId(Long id, Long userId);

    Optional<NoteFolder> findByCodeIgnoreCaseAndUserId(String code, Long userId);

    long countByUserId(Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
