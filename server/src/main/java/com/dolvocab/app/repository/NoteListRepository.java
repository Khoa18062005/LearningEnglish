package com.dolvocab.app.repository;

import com.dolvocab.app.entity.NoteList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteListRepository extends JpaRepository<NoteList, Long> {

    Optional<NoteList> findByCodeIgnoreCase(String code);

    Optional<NoteList> findByTitleIgnoreCase(String title);

    @Query("SELECT n.id, n.title, n.code, n.sourceReference, n.passage, n.note, n.createdAt, COUNT(v.id) " +
           "FROM NoteList n LEFT JOIN n.vocabularies v " +
           "GROUP BY n.id, n.title, n.code, n.sourceReference, n.passage, n.note, n.createdAt " +
           "ORDER BY n.id ASC")
    List<Object[]> findNoteListsWithVocabCount();
}
