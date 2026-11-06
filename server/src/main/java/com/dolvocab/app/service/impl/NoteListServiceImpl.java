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
import com.dolvocab.app.repository.NoteFolderRepository;
import com.dolvocab.app.repository.NoteListRepository;
import com.dolvocab.app.repository.ReadingPassageRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.NoteListService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NoteListServiceImpl implements NoteListService {

    private final NoteListRepository noteListRepository;
    private final NoteFolderRepository noteFolderRepository;
    private final ReadingPassageRepository readingPassageRepository;
    private final SecurityUtils securityUtils;

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
                    .id(-1L)
                    .title("Nội dung bài đọc")
                    .content(fallbackLegacyPassage)
                    .wordCount(countWords(fallbackLegacyPassage))
                    .sortOrder(0)
                    .build());
        }
        return list;
    }

    private NoteListResponse toResponse(NoteList list, long count) {
        String code = list.getCode();
        String title = list.getTitle();
        String shortTitle = (code != null && !code.trim().isEmpty()) ? code.trim() : title;
        String fullTitle = (code != null && !code.trim().isEmpty() && !code.trim().equalsIgnoreCase(title))
                ? code.trim() + ": " + title
                : title;

        Long folderId = list.getFolder() != null ? list.getFolder().getId() : null;
        String folderCode = list.getFolder() != null ? list.getFolder().getCode() : null;
        String folderName = list.getFolder() != null ? list.getFolder().getName() : null;

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
        List<Object[]> rows = noteListRepository.findNoteListsWithVocabCountByUserId(currentUser.getId());
        List<NoteListResponse> responses = new ArrayList<>();

        // Nạp toàn bộ passages của user để group theo noteListId (tránh N+1 query)
        List<ReadingPassage> userPassages = readingPassageRepository.findAllByUserIdOrdered(currentUser.getId());
        Map<Long, List<ReadingPassageResponse>> passagesByListId = new HashMap<>();
        for (ReadingPassage rp : userPassages) {
            Long listId = rp.getNoteList().getId();
            passagesByListId.computeIfAbsent(listId, k -> new ArrayList<>()).add(
                    ReadingPassageResponse.builder()
                            .id(rp.getId())
                            .title(rp.getTitle())
                            .content(rp.getContent())
                            .wordCount(rp.getWordCount() != null ? rp.getWordCount() : countWords(rp.getContent()))
                            .sortOrder(rp.getSortOrder())
                            .createdAt(rp.getCreatedAt())
                            .updatedAt(rp.getUpdatedAt())
                            .build()
            );
        }

        for (Object[] row : rows) {
            Long id = (Long) row[0];
            String title = (String) row[1];
            String code = (String) row[2];
            String source = (String) row[3];
            String legacyPassage = (String) row[4];
            String note = (String) row[5];
            LocalDateTime createdAt = (LocalDateTime) row[6];
            long count = ((Number) row[7]).longValue();
            Long folderId = row.length > 8 ? (Long) row[8] : null;
            String folderCode = row.length > 9 ? (String) row[9] : null;
            String folderName = row.length > 10 ? (String) row[10] : null;
            Integer sortOrder = row.length > 11 && row[11] != null ? ((Number) row[11]).intValue() : null;

            String shortTitle = (code != null && !code.trim().isEmpty()) ? code.trim() : title;
            String fullTitle = (code != null && !code.trim().isEmpty() && !code.trim().equalsIgnoreCase(title))
                    ? code.trim() + ": " + title
                    : title;

            List<ReadingPassageResponse> listPassages = passagesByListId.getOrDefault(id, new ArrayList<>());
            if (listPassages.isEmpty() && legacyPassage != null && !legacyPassage.trim().isEmpty()) {
                listPassages.add(ReadingPassageResponse.builder()
                        .id(-1L)
                        .title("Nội dung bài đọc")
                        .content(legacyPassage)
                        .wordCount(countWords(legacyPassage))
                        .sortOrder(0)
                        .build());
            }

            responses.add(NoteListResponse.builder()
                    .id(id)
                    .title(title)
                    .code(code)
                    .shortTitle(shortTitle)
                    .fullTitle(fullTitle)
                    .sourceReference(source)
                    .passage(legacyPassage)
                    .passages(listPassages)
                    .note(note)
                    .createdAt(createdAt)
                    .count(count)
                    .folderId(folderId)
                    .folderCode(folderCode)
                    .folderName(folderName)
                    .sortOrder(sortOrder)
                    .build());
        }
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public NoteListResponse getNoteListById(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        NoteList list = noteListRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Reading List với ID: " + id));

        return toResponse(list, list.getVocabularies().size());
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
                throw new RuntimeException("Mã danh sách '" + code + "' đã tồn tại!");
            }
        }

        NoteFolder folder = null;
        if (request.getFolderId() != null) {
            folder = noteFolderRepository.findByIdAndUserId(request.getFolderId(), currentUser.getId())
                    .orElse(null);
        }

        NoteList list = NoteList.builder()
                .user(currentUser)
                .folder(folder)
                .title(request.getTitle().trim())
                .code(code)
                .sourceReference(request.getSourceReference() != null ? request.getSourceReference().trim() : null)
                .passage(request.getPassage() != null ? request.getPassage().trim() : null)
                .note(request.getNote() != null ? request.getNote().trim() : null)
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
                    ReadingPassage rp = ReadingPassage.builder()
                            .noteList(list)
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
        return toResponse(saved, 0);
    }

    @Override
    @Transactional
    public NoteListResponse updateNoteList(Long id, NoteListCreateRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        NoteList list = noteListRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Reading List với ID: " + id));

        list.setTitle(request.getTitle().trim());
        if (request.getCode() != null && !request.getCode().trim().isEmpty()) {
            String newCode = request.getCode().trim();
            java.util.Optional<NoteList> existing = noteListRepository.findByCodeIgnoreCaseAndUserId(newCode, currentUser.getId());
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new RuntimeException("Mã danh sách '" + newCode + "' đã tồn tại!");
            }
            list.setCode(newCode);
        }
        list.setSourceReference(request.getSourceReference() != null ? request.getSourceReference().trim() : null);
        list.setPassage(request.getPassage() != null ? request.getPassage().trim() : null);
        list.setNote(request.getNote() != null ? request.getNote().trim() : null);

        if (request.getFolderId() != null) {
            NoteFolder folder = noteFolderRepository.findByIdAndUserId(request.getFolderId(), currentUser.getId())
                    .orElse(null);
            list.setFolder(folder);
        } else {
            list.setFolder(null);
        }

        // Cập nhật danh sách passages nếu có gửi trong request
        if (request.getPassages() != null) {
            list.getPassages().clear();
            int order = 0;
            for (ReadingPassageRequest pr : request.getPassages()) {
                boolean hasTitle = pr.getTitle() != null && !pr.getTitle().trim().isEmpty();
                boolean hasContent = pr.getContent() != null && !pr.getContent().trim().isEmpty();
                if (hasTitle || hasContent) {
                    String pTitle = hasTitle ? pr.getTitle().trim() : ("Bài đọc " + (order + 1));
                    String pContent = pr.getContent() != null ? pr.getContent() : "";
                    int wc = (pr.getWordCount() != null && pr.getWordCount() > 0) ? pr.getWordCount() : countWords(pContent);
                    ReadingPassage rp = ReadingPassage.builder()
                            .noteList(list)
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
        return toResponse(saved, list.getVocabularies().size());
    }

    @Override
    @Transactional
    public void deleteNoteList(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        NoteList list = noteListRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Reading List với ID: " + id));

        // Disconnect many-to-many references from vocabularies
        if (list.getVocabularies() != null) {
            for (Vocabulary v : list.getVocabularies()) {
                v.getNoteLists().remove(list);
            }
        }

        noteListRepository.delete(list);
    }

    @Override
    @Transactional
    public void reorderNoteLists(List<Long> listIds) {
        if (listIds == null || listIds.isEmpty()) return;
        User currentUser = securityUtils.getCurrentUser();
        for (int i = 0; i < listIds.size(); i++) {
            Long listId = listIds.get(i);
            if (listId == null) continue;
            var listOpt = noteListRepository.findByIdAndUserId(listId, currentUser.getId());
            if (listOpt.isPresent()) {
                NoteList list = listOpt.get();
                list.setSortOrder(i);
                noteListRepository.save(list);
            }
        }
    }

    @Override
    @Transactional
    public NoteList getOrCreateNoteList(String identifier, String title, User user) {
        if (identifier != null && !identifier.trim().isEmpty()) {
            try {
                Long id = Long.parseLong(identifier.trim());
                return noteListRepository.findByIdAndUserId(id, user.getId()).orElse(null);
            } catch (NumberFormatException ignored) {
                var byCode = noteListRepository.findByCodeIgnoreCaseAndUserId(identifier.trim(), user.getId());
                if (byCode.isPresent()) return byCode.get();

                var byTitle = noteListRepository.findByTitleIgnoreCaseAndUserId(identifier.trim(), user.getId());
                if (byTitle.isPresent()) return byTitle.get();
            }
        }

        if (title != null && !title.trim().isEmpty()) {
            return noteListRepository.findByTitleIgnoreCaseAndUserId(title.trim(), user.getId())
                    .orElseGet(() -> noteListRepository.save(
                            NoteList.builder()
                                    .user(user)
                                    .title(title.trim())
                                    .code(String.format("LIST %02d", noteListRepository.countByUserId(user.getId()) + 1))
                                    .build()
                    ));
        }

        return null;
    }
}
