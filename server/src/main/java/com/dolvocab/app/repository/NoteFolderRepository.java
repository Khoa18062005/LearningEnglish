package com.dolvocab.app.repository;

import com.dolvocab.app.entity.NoteFolder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteFolderRepository extends MongoRepository<NoteFolder, String> {

    List<NoteFolder> findAllByUserIdOrderBySortOrderAscIdAsc(String userId);

    List<NoteFolder> findAllByUserIdOrderByIdAsc(String userId);

    Optional<NoteFolder> findByIdAndUserId(String id, String userId);

    Optional<NoteFolder> findByCodeIgnoreCaseAndUserId(String code, String userId);

    long countByUserId(String userId);

    boolean existsByIdAndUserId(String id, String userId);

    default List<NoteFolder> findAllByUserIdOrdered(String userId) {
        return findAllByUserIdOrderBySortOrderAscIdAsc(userId);
    }
}
