package com.dolvocab.app.repository;

import com.dolvocab.app.entity.NoteList;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteListRepository extends MongoRepository<NoteList, String> {

    List<NoteList> findAllByUserIdOrderByIdAsc(String userId);

    List<NoteList> findAllByUserIdOrderBySortOrderAscIdAsc(String userId);

    default List<NoteList> findAllByUserIdOrdered(String userId) {
        return findAllByUserIdOrderBySortOrderAscIdAsc(userId);
    }

    Optional<NoteList> findByIdAndUserId(String id, String userId);

    Optional<NoteList> findByCodeIgnoreCaseAndUserId(String code, String userId);

    Optional<NoteList> findByTitleIgnoreCaseAndUserId(String title, String userId);

    long countByUserId(String userId);

    boolean existsByIdAndUserId(String id, String userId);

    List<NoteList> findAllByFolderId(String folderId);

    List<NoteList> findAllByFolderIdAndUserIdOrderByIdAsc(String folderId, String userId);

    List<NoteList> findAllByFolderIdAndUserIdOrderBySortOrderAscIdAsc(String folderId, String userId);

    default List<NoteList> findAllByFolderIdAndUserIdOrdered(String folderId, String userId) {
        return findAllByFolderIdAndUserIdOrderBySortOrderAscIdAsc(folderId, userId);
    }
}
