package com.dolvocab.app.repository;

import com.dolvocab.app.entity.ReadingPassage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadingPassageRepository extends JpaRepository<ReadingPassage, Long> {
    List<ReadingPassage> findAllByNoteListIdOrderBySortOrderAscIdAsc(Long noteListId);

    @Query("SELECT p FROM ReadingPassage p WHERE p.noteList.user.id = :userId ORDER BY COALESCE(p.sortOrder, 999999) ASC, p.id ASC")
    List<ReadingPassage> findAllByUserIdOrdered(@Param("userId") Long userId);
}

