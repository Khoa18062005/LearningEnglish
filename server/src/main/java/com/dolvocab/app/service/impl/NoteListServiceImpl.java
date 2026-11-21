package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.NoteListCreateRequest;
import com.dolvocab.app.dto.request.ReadingPassageRequest;
import com.dolvocab.app.dto.response.NoteListResponse;
import com.dolvocab.app.dto.response.ReadingPassageResponse;
import com.dolvocab.app.entity.NoteFolder;
import com.dolvocab.app.entity.NoteList;
import com.dolvocab.app.entity.ReadingPassage;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.exception.ConflictException;
import com.dolvocab.app.exception.ResourceNotFoundException;
import com.dolvocab.app.repository.NoteFolderRepository;
import com.dolvocab.app.repository.NoteListRepository;
import com.dolvocab.app.repository.VocabularyRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.NoteListService;
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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteListServiceImpl implements NoteListService {

    private final NoteListRepository noteListRepository;
    private final NoteFolderRepository noteFolderRepository;
    private final VocabularyRepository vocabularyRepository;
    private final SecurityUtils securityUtils;
    private final MongoTemplate mongoTemplate;

    private int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        String clean = text.replaceAll("<[^>]*>", " ").replaceAll("&nbsp;", " ").trim();
        if (clean.isBlank()) return 0;
        return clean.split("\\s+").length;
    }

    private List<ReadingPassageResponse> mapPassagesToResponse(List<ReadingPassage> passages, String fallbackLegacyPassage) {
        List<ReadingPassageResponse> list = new ArrayList<>();
        if (passages != null && !passages.isEmpty()) {
            for (ReadingPassage rp : passages) {
                list.add(ReadingPassageResponse.builder()
                        .id(rp.getId())
                        .title(rp.getTitle())
                        .content(rp.getContent())
                        .wordCount(rp.getWordCount() != null ? rp.getWordCount() : countWords(rp.getContent()))
                        .sortOrder(rp.getSortOrder())
                        .createdAt(rp.getCreatedAt())
                        .updatedAt(rp.getUpdatedAt())
                        .build());
            }
        } else if (fallbackLegacyPassage != null && !fallbackLegacyPassage.trim().isEmpty()) {
            list.add(ReadingPassageResponse.builder()
                    .id(new ObjectId().toHexString())
                    .title("Nội dung bài đọc")
                    .content(fallbackLegacyPassage)
                    .wordCount(countWords(fallbackLegacyPassage))
                    .sortOrder(0)
                    .build());
        }
        return list;
    }

    private NoteListResponse toResponse(NoteList list, long count, NoteFolder folder) {
        String code = list.getCode();
        String title = list.getTitle();
        String shortTitle = (code != null && !code.trim().isEmpty()) ? code.trim() : title;
        String fullTitle = (code != null && !code.trim().isEmpty() && !code.trim().equalsIgnoreCase(title))
                ? code.trim() + ": " + title
                : title;

        String folderId = list.getFolderId();
        String folderCode = folder != null ? folder.getCode() : null;
        String folderName = folder != null ? folder.getName() : null;

        List<ReadingPassageResponse> passageResponses = mapPassagesToResponse(list.getPassages(), list.getPassage());

        return NoteListResponse.builder()
                .id(list.getId())
                .title(title)
                .code(code)
                .shortTitle(shortTitle)
                .fullTitle(fullTitle)
                .sourceReference(list.getSourceReference())
                .passage(list.getPassage())
                .passages(passageResponses)
                .note(list.getNote())
                .createdAt(list.getCreatedAt())
                .count(count)
                .folderId(folderId)
                .folderCode(folderCode)
                .folderName(folderName)
                .sortOrder(list.getSortOrder())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteListResponse> getAllNoteLists() {
        User currentUser = securityUtils.getCurrentUser();
        List<NoteList> lists = noteListRepository.findAllByUserIdOrdered(currentUser.getId());
        Map<String, Long> countMap = vocabularyRepository.countVocabulariesGroupedByNoteListIds(currentUser.getId());

        List<NoteFolder> folders = noteFolderRepository.findAllByUserIdOrdered(currentUser.getId());
        Map<String, NoteFolder> folderMap = folders.stream()
                .collect(Collectors.toMap(NoteFolder::getId, f -> f, (existing, replacing) -> existing));

        List<NoteListResponse> responses = new ArrayList<>();
        for (NoteList nl : lists) {
            long count = countMap.getOrDefault(nl.getId(), 0L);
            NoteFolder folder = nl.getFolderId() != null ? folderMap.get(nl.getFolderId()) : null;
            responses.add(toResponse(nl, count, folder));
        }

        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public NoteListResponse getNoteListById(String id) {
        ObjectIdValidator.validate(id, "Reading List");
        User currentUser = securityUtils.getCurrentUser();
        NoteList list = noteListRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Reading List với ID: " + id));

        Map<String, Long> countMap = vocabularyRepository.countVocabulariesGroupedByNoteListIds(currentUser.getId());
        long count = countMap.getOrDefault(list.getId(), 0L);

        NoteFolder folder = null;
        if (list.getFolderId() != null) {
            folder = noteFolderRepository.findByIdAndUserId(list.getFolderId(), currentUser.getId()).orElse(null);
        }

        return toResponse(list, count, folder);
    }

    @Override
    @Transactional
    public NoteListResponse createNoteList(NoteListCreateRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        String code = request.getCode();
        if (code == null || code.trim().isEmpty()) {
            long counter = 1;
            String candidate = String.format("LIST %02d", counter);
            while (noteListRepository.findByCodeIgnoreCaseAndUserId(candidate, currentUser.getId()).isPresent()) {
                counter++;
                candidate = String.format("LIST %02d", counter);
            }
            code = candidate;
        } else {
            code = code.trim();
            if (noteListRepository.findByCodeIgnoreCaseAndUserId(code, currentUser.getId()).isPresent()) {
                throw new ConflictException("Mã danh sách '" + code + "' đã tồn tại!");
            }
        }

        String folderId = null;
        NoteFolder folder = null;
        if (request.getFolderId() != null && !request.getFolderId().isBlank()) {
            ObjectIdValidator.validate(request.getFolderId(), "thư mục");
            folder = noteFolderRepository.findByIdAndUserId(request.getFolderId(), currentUser.getId()).orElse(null);
            if (folder != null) {
                folderId = folder.getId();
            }
        }

        long count = noteListRepository.countByUserId(currentUser.getId());

        NoteList list = NoteList.builder()
                .userId(currentUser.getId())
                .folderId(folderId)
                .title(request.getTitle().trim())
                .code(code)
                .codeLower(code.toLowerCase())
                .sourceReference(request.getSourceReference() != null ? request.getSourceReference().trim() : null)
                .passage(request.getPassage() != null ? request.getPassage().trim() : null)
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .sortOrder((int) count)
                .build();

        if (request.getPassages() != null && !request.getPassages().isEmpty()) {
            int order = 0;
            for (ReadingPassageRequest pr : request.getPassages()) {
                boolean hasTitle = pr.getTitle() != null && !pr.getTitle().trim().isEmpty();
                boolean hasContent = pr.getContent() != null && !pr.getContent().trim().isEmpty();
                if (hasTitle || hasContent) {
                    String pTitle = hasTitle ? pr.getTitle().trim() : ("Bài đọc " + (order + 1));
                    String pContent = pr.getContent() != null ? pr.getContent() : "";
                    int wc = (pr.getWordCount() != null && pr.getWordCount() > 0) ? pr.getWordCount() : countWords(pContent);
                    String pid = (pr.getId() != null && ObjectId.isValid(pr.getId())) ? pr.getId() : new ObjectId().toHexString();

                    ReadingPassage rp = ReadingPassage.builder()
                            .id(pid)
                            .title(pTitle)
                            .content(pContent)
                            .wordCount(wc)
                            .sortOrder(pr.getSortOrder() != null ? pr.getSortOrder() : order)
                            .build();
                    list.getPassages().add(rp);
                    order++;
                }
            }
        }

        NoteList saved = noteListRepository.save(list);
        return toResponse(saved, 0, folder);
    }

    @Override
    @Transactional
    public NoteListResponse updateNoteList(String id, NoteListCreateRequest request) {
        ObjectIdValidator.validate(id, "Reading List");
        User currentUser = securityUtils.getCurrentUser();
        NoteList list = noteListRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Reading List với ID: " + id));

        list.setTitle(request.getTitle().trim());
        if (request.getCode() != null && !request.getCode().trim().isEmpty()) {
            String newCode = request.getCode().trim();
            Optional<NoteList> existing = noteListRepository.findByCodeIgnoreCaseAndUserId(newCode, currentUser.getId());
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new ConflictException("Mã danh sách '" + newCode + "' đã tồn tại!");
            }
            list.setCode(newCode);
            list.setCodeLower(newCode.toLowerCase());
        }
        list.setSourceReference(request.getSourceReference() != null ? request.getSourceReference().trim() : null);
        list.setPassage(request.getPassage() != null ? request.getPassage().trim() : null);
        list.setNote(request.getNote() != null ? request.getNote().trim() : null);

        NoteFolder folder = null;
        if (request.getFolderId() != null && !request.getFolderId().isBlank()) {
            ObjectIdValidator.validate(request.getFolderId(), "thư mục");
            folder = noteFolderRepository.findByIdAndUserId(request.getFolderId(), currentUser.getId()).orElse(null);
            list.setFolderId(folder != null ? folder.getId() : null);
        } else {
            list.setFolderId(null);
        }

        // Cập nhật danh sách passages nếu có gửi trong request
        if (request.getPassages() != null) {
            // Giữ lại bài đọc cũ theo ID để bảo toàn ID và createdAt khi cập nhật
            java.util.Map<String, ReadingPassage> existingById = new java.util.HashMap<>();
            for (ReadingPassage old : list.getPassages()) {
                if (old.getId() != null) existingById.put(old.getId(), old);
            }
            list.getPassages().clear();
            int order = 0;
            for (ReadingPassageRequest pr : request.getPassages()) {
                boolean hasTitle = pr.getTitle() != null && !pr.getTitle().trim().isEmpty();
                boolean hasContent = pr.getContent() != null && !pr.getContent().trim().isEmpty();
                if (hasTitle || hasContent) {
                    String pTitle = hasTitle ? pr.getTitle().trim() : ("Bài đọc " + (order + 1));
                    String pContent = pr.getContent() != null ? pr.getContent() : "";
                    int wc = (pr.getWordCount() != null && pr.getWordCount() > 0) ? pr.getWordCount() : countWords(pContent);
                    // Chỉ giữ ID nếu bài đọc đó thực sự thuộc danh sách này; ngược lại sinh ID mới
                    ReadingPassage previous = pr.getId() != null ? existingById.get(pr.getId()) : null;
                    String pid = previous != null ? previous.getId() : new ObjectId().toHexString();

                    ReadingPassage rp = ReadingPassage.builder()
                            .id(pid)
                            .title(pTitle)
                            .content(pContent)
                            .wordCount(wc)
                            .sortOrder(pr.getSortOrder() != null ? pr.getSortOrder() : order)
                            .build();
                    if (previous != null && previous.getCreatedAt() != null) {
                        rp.setCreatedAt(previous.getCreatedAt());
                    }
                    list.getPassages().add(rp);
                    order++;
                }
            }
        }

        NoteList saved = noteListRepository.save(list);
        Map<String, Long> countMap = vocabularyRepository.countVocabulariesGroupedByNoteListIds(currentUser.getId());
        long count = countMap.getOrDefault(saved.getId(), 0L);

        return toResponse(saved, count, folder);
    }

    @Override
    @Transactional
    public void deleteNoteList(String id) {
        ObjectIdValidator.validate(id, "Reading List");
        User currentUser = securityUtils.getCurrentUser();
        NoteList list = noteListRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Reading List với ID: " + id));

        // M4-05: Cascade pull noteListId from vocabularies
        Query pullQuery = Query.query(Criteria.where("userId").is(new ObjectId(currentUser.getId())));
        Update pullUpdate = new Update()
                .pull("noteListIds", new ObjectId(id));
        mongoTemplate.updateMulti(pullQuery, pullUpdate, Vocabulary.class);

        noteListRepository.delete(list);
    }

    @Override
    @Transactional
    public void reorderNoteLists(List<String> listIds) {
        if (listIds == null || listIds.isEmpty()) return;
        User currentUser = securityUtils.getCurrentUser();

        BulkOperations ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, NoteList.class);
        boolean hasOps = false;
        for (int i = 0; i < listIds.size(); i++) {
            String listId = listIds.get(i);
            if (listId != null && ObjectId.isValid(listId)) {
                Query query = Query.query(Criteria.where("_id").is(new ObjectId(listId))
                        .and("userId").is(new ObjectId(currentUser.getId())));
                ops.updateOne(query, Update.update("sortOrder", i));
                hasOps = true;
            }
        }
        if (hasOps) {
            ops.execute();
        }
    }

    @Override
    @Transactional
    public NoteList getOrCreateNoteList(String identifier, String title, User user) {
        if (identifier != null && !identifier.trim().isEmpty()) {
            String trimmed = identifier.trim();
            if (ObjectId.isValid(trimmed)) {
                var byId = noteListRepository.findByIdAndUserId(trimmed, user.getId());
                if (byId.isPresent()) return byId.get();
            }
            var byCode = noteListRepository.findByCodeIgnoreCaseAndUserId(trimmed, user.getId());
            if (byCode.isPresent()) return byCode.get();

            var byTitle = noteListRepository.findByTitleIgnoreCaseAndUserId(trimmed, user.getId());
            if (byTitle.isPresent()) return byTitle.get();
        }

        if (title != null && !title.trim().isEmpty()) {
            return noteListRepository.findByTitleIgnoreCaseAndUserId(title.trim(), user.getId())
                    .orElseGet(() -> {
                        long count = noteListRepository.countByUserId(user.getId());
                        String code = String.format("LIST %02d", count + 1);
                        return noteListRepository.save(
                                NoteList.builder()
                                        .userId(user.getId())
                                        .title(title.trim())
                                        .code(code)
                                        .codeLower(code.toLowerCase())
                                        .sortOrder((int) count)
                                        .build()
                        );
                    });
        }

        return null;
    }
}
