package com.dolvocab.app.repository;

import com.dolvocab.app.entity.NoteList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteListRepository extends JpaRepository<NoteList, Long> {

    List<NoteList> findAllByUserIdOrderByIdAsc(Long userId);

    Optional<NoteList> findByIdAndUserId(Long id, Long userId);

    Optional<NoteList> findByCodeIgnoreCaseAndUserId(String code, Long userId);

    Optional<NoteList> findByTitleIgnoreCaseAndUserId(String title, Long userId);

    long countByUserId(Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);

    List<NoteList> findAllByFolderId(Long folderId);

    List<NoteList> findAllByFolderIdAndUserIdOrderByIdAsc(Long folderId, Long userId);

    @Query("SELECT n FROM NoteList n WHERE n.folder.id = :folderId AND n.user.id = :userId ORDER BY COALESCE(n.sortOrder, 999999) ASC, n.id ASC")
    List<NoteList> findAllByFolderIdAndUserIdOrdered(@Param("folderId") Long folderId, @Param("userId") Long userId);

    @Query("SELECT n FROM NoteList n WHERE n.user.id = :userId ORDER BY COALESCE(n.sortOrder, 999999) ASC, n.id ASC")
    List<NoteList> findAllByUserIdOrdered(@Param("userId") Long userId);

    @Query("SELECT n.id, n.title, n.code, n.sourceReference, n.passage, n.note, n.createdAt, COUNT(v.id), f.id, f.code, f.name, n.sortOrder " +
           "FROM NoteList n LEFT JOIN n.vocabularies v LEFT JOIN n.folder f " +
           "WHERE n.user.id = :userId " +
           "GROUP BY n.id, n.title, n.code, n.sourceReference, n.passage, n.note, n.createdAt, f.id, f.code, f.name, n.sortOrder " +
           "ORDER BY COALESCE(n.sortOrder, 999999) ASC, n.id ASC")
    List<Object[]> findNoteListsWithVocabCountByUserId(@Param("userId") Long userId);
}
