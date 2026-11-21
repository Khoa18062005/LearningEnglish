package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.NoteFolderRequest;
import com.dolvocab.app.dto.response.NoteFolderResponse;
import com.dolvocab.app.dto.response.NoteListResponse;
import com.dolvocab.app.entity.NoteFolder;
import com.dolvocab.app.entity.NoteList;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.exception.ConflictException;
import com.dolvocab.app.exception.ResourceNotFoundException;
import com.dolvocab.app.repository.NoteFolderRepository;
import com.dolvocab.app.repository.NoteListRepository;
import com.dolvocab.app.repository.VocabularyRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.NoteFolderService;
import com.dolvocab.app.utils.ObjectIdValidator;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NoteFolderServiceImpl implements NoteFolderService {

    private final NoteFolderRepository noteFolderRepository;
    private final NoteListRepository noteListRepository;
    private final VocabularyRepository vocabularyRepository;
    private final SecurityUtils securityUtils;
    private final MongoTemplate mongoTemplate;

    private NoteFolderResponse toResponse(NoteFolder folder, List<NoteList> lists, Map<String, Long> vocabCountMap) {
        List<NoteListResponse> listResponses = new ArrayList<>();
        long totalWords = 0;

        if (lists != null) {
            for (NoteList nl : lists) {
                long vocabCount = vocabCountMap.getOrDefault(nl.getId(), 0L);
                totalWords += vocabCount;

                String code = nl.getCode();
                String title = nl.getTitle();
                String shortTitle = (code != null && !code.trim().isEmpty()) ? code.trim() : title;
                String fullTitle = (code != null && !code.trim().isEmpty() && !code.trim().equalsIgnoreCase(title))
                        ? code.trim() + ": " + title
                        : title;

                listResponses.add(NoteListResponse.builder()
                        .id(nl.getId())
                        .title(title)
                        .code(code)
                        .shortTitle(shortTitle)
                        .fullTitle(fullTitle)
                        .sourceReference(nl.getSourceReference())
                        .passage(nl.getPassage())
                        .note(nl.getNote())
                        .createdAt(nl.getCreatedAt())
                        .count(vocabCount)
                        .folderId(folder.getId())
                        .folderCode(folder.getCode())
                        .folderName(folder.getName())
                        .build());
            }
        }

        return NoteFolderResponse.builder()
                .id(folder.getId())
                .code(folder.getCode())
                .name(folder.getName())
                .description(folder.getDescription())
                .createdAt(folder.getCreatedAt())
                .totalLists(listResponses.size())
                .totalWords(totalWords)
                .sortOrder(folder.getSortOrder())
                .lists(listResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteFolderResponse> getAllFolders() {
        User currentUser = securityUtils.getCurrentUser();
        List<NoteFolder> folders = noteFolderRepository.findAllByUserIdOrdered(currentUser.getId());
        Map<String, Long> vocabCountMap = vocabularyRepository.countVocabulariesGroupedByNoteListIds(currentUser.getId());

        List<NoteFolderResponse> responses = new ArrayList<>();
        for (NoteFolder f : folders) {
            List<NoteList> lists = noteListRepository.findAllByFolderIdAndUserIdOrdered(f.getId(), currentUser.getId());
            responses.add(toResponse(f, lists, vocabCountMap));
        }

        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public NoteFolderResponse getFolderById(String id) {
        ObjectIdValidator.validate(id, "thư mục");
        User currentUser = securityUtils.getCurrentUser();
        NoteFolder folder = noteFolderRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thư mục với ID: " + id));

        Map<String, Long> vocabCountMap = vocabularyRepository.countVocabulariesGroupedByNoteListIds(currentUser.getId());
        List<NoteList> lists = noteListRepository.findAllByFolderIdAndUserIdOrdered(folder.getId(), currentUser.getId());
        return toResponse(folder, lists, vocabCountMap);
    }

    @Override
    @Transactional
    public NoteFolderResponse createFolder(NoteFolderRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        String name = request.getName().trim();
        String rawCode = request.getCode() != null ? request.getCode().trim().replaceAll("[^a-zA-Z0-9]", "").toUpperCase() : "";
        String code = !rawCode.isEmpty()
                ? (rawCode.length() > 8 ? rawCode.substring(0, 8) : rawCode)
                : null;

        if (code != null && noteFolderRepository.findByCodeIgnoreCaseAndUserId(code, currentUser.getId()).isPresent()) {
            throw new ConflictException("Mã thư mục '" + code + "' đã tồn tại!");
        }

        long count = noteFolderRepository.countByUserId(currentUser.getId());

        NoteFolder folder = NoteFolder.builder()
                .userId(currentUser.getId())
                .code(code)
                .name(name)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .sortOrder((int) count)
                .build();

        NoteFolder saved = noteFolderRepository.save(folder);
        return toResponse(saved, new ArrayList<>(), Map.of());
    }

    @Override
    @Transactional
    public NoteFolderResponse updateFolder(String id, NoteFolderRequest request) {
        ObjectIdValidator.validate(id, "thư mục");
        User currentUser = securityUtils.getCurrentUser();
        NoteFolder folder = noteFolderRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thư mục với ID: " + id));

        String rawNewCode = request.getCode() != null ? request.getCode().trim().replaceAll("[^a-zA-Z0-9]", "").toUpperCase() : "";
        String newCode = !rawNewCode.isEmpty()
                ? (rawNewCode.length() > 8 ? rawNewCode.substring(0, 8) : rawNewCode)
                : null;

        if (newCode != null) {
            var existing = noteFolderRepository.findByCodeIgnoreCaseAndUserId(newCode, currentUser.getId());
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new ConflictException("Mã thư mục '" + newCode + "' đã tồn tại!");
            }
        }

        folder.setCode(newCode);
        folder.setName(request.getName().trim());
        folder.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        NoteFolder saved = noteFolderRepository.save(folder);
        Map<String, Long> vocabCountMap = vocabularyRepository.countVocabulariesGroupedByNoteListIds(currentUser.getId());
        List<NoteList> lists = noteListRepository.findAllByFolderIdAndUserIdOrdered(saved.getId(), currentUser.getId());
        return toResponse(saved, lists, vocabCountMap);
    }

    @Override
    @Transactional
    public void deleteFolder(String id) {
        ObjectIdValidator.validate(id, "thư mục");
        User currentUser = securityUtils.getCurrentUser();
        NoteFolder folder = noteFolderRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thư mục với ID: " + id));

        // M4-05: Tách các note_list con ra khỏi folder (folderId = null)
        Query listQuery = Query.query(Criteria.where("userId").is(new ObjectId(currentUser.getId()))
                .and("folderId").is(new ObjectId(id)));
        mongoTemplate.updateMulti(listQuery, new Update().unset("folderId"), NoteList.class);

        noteFolderRepository.delete(folder);
    }

    @Override
    @Transactional
    public void reorderFolders(List<String> folderIds) {
        if (folderIds == null || folderIds.isEmpty()) return;
        User currentUser = securityUtils.getCurrentUser();

        BulkOperations ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, NoteFolder.class);
        boolean hasOps = false;
        for (int i = 0; i < folderIds.size(); i++) {
            String folderId = folderIds.get(i);
            if (folderId != null && ObjectId.isValid(folderId)) {
                Query query = Query.query(Criteria.where("_id").is(new ObjectId(folderId))
                        .and("userId").is(new ObjectId(currentUser.getId())));
                ops.updateOne(query, Update.update("sortOrder", i));
                hasOps = true;
            }
        }
        if (hasOps) {
            ops.execute();
        }
    }
}
