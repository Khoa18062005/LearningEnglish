package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.NoteFolderRequest;
import com.dolvocab.app.dto.response.NoteFolderResponse;
import com.dolvocab.app.dto.response.NoteListResponse;
import com.dolvocab.app.entity.NoteFolder;
import com.dolvocab.app.entity.NoteList;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.repository.NoteFolderRepository;
import com.dolvocab.app.repository.NoteListRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.NoteFolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NoteFolderServiceImpl implements NoteFolderService {

    private final NoteFolderRepository noteFolderRepository;
    private final NoteListRepository noteListRepository;
    private final SecurityUtils securityUtils;

    private NoteFolderResponse toResponse(NoteFolder folder, List<NoteList> lists) {
        List<NoteListResponse> listResponses = new ArrayList<>();
        Set<Long> uniqueVocabIds = new HashSet<>();

        if (lists != null) {
            for (NoteList nl : lists) {
                int vocabCount = nl.getVocabularies() != null ? nl.getVocabularies().size() : 0;
                if (nl.getVocabularies() != null) {
                    nl.getVocabularies().forEach(v -> uniqueVocabIds.add(v.getId()));
                }

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
                .totalWords(uniqueVocabIds.size())
                .sortOrder(folder.getSortOrder())
                .lists(listResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteFolderResponse> getAllFolders() {
        User currentUser = securityUtils.getCurrentUser();
        List<NoteFolder> folders = noteFolderRepository.findAllByUserIdOrdered(currentUser.getId());
        List<NoteFolderResponse> responses = new ArrayList<>();

        for (NoteFolder f : folders) {
            List<NoteList> lists = noteListRepository.findAllByFolderIdAndUserIdOrdered(f.getId(), currentUser.getId());
            responses.add(toResponse(f, lists));
        }

        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public NoteFolderResponse getFolderById(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        NoteFolder folder = noteFolderRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục với ID: " + id));

        List<NoteList> lists = noteListRepository.findAllByFolderIdAndUserIdOrdered(folder.getId(), currentUser.getId());
        return toResponse(folder, lists);
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
            throw new RuntimeException("Mã thư mục '" + code + "' đã tồn tại!");
        }

        NoteFolder folder = NoteFolder.builder()
                .user(currentUser)
                .code(code)
                .name(name)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .build();

        NoteFolder saved = noteFolderRepository.save(folder);
        return toResponse(saved, new ArrayList<>());
    }

    @Override
    @Transactional
    public NoteFolderResponse updateFolder(Long id, NoteFolderRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        NoteFolder folder = noteFolderRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục với ID: " + id));

        String rawNewCode = request.getCode() != null ? request.getCode().trim().replaceAll("[^a-zA-Z0-9]", "").toUpperCase() : "";
        String newCode = !rawNewCode.isEmpty()
                ? (rawNewCode.length() > 8 ? rawNewCode.substring(0, 8) : rawNewCode)
                : null;

        if (newCode != null) {
            var existing = noteFolderRepository.findByCodeIgnoreCaseAndUserId(newCode, currentUser.getId());
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new RuntimeException("Mã thư mục '" + newCode + "' đã tồn tại!");
            }
        }

        folder.setCode(newCode);
        folder.setName(request.getName().trim());
        folder.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        NoteFolder saved = noteFolderRepository.save(folder);
        List<NoteList> lists = noteListRepository.findAllByFolderIdAndUserIdOrdered(saved.getId(), currentUser.getId());
        return toResponse(saved, lists);
    }

    @Override
    @Transactional
    public void deleteFolder(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        NoteFolder folder = noteFolderRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục với ID: " + id));

        // Tách các list con ra khỏi folder (chuyển về độc lập / không folder) trước khi xóa folder
        List<NoteList> lists = noteListRepository.findAllByFolderId(id);
        for (NoteList list : lists) {
            list.setFolder(null);
            noteListRepository.save(list);
        }

        noteFolderRepository.delete(folder);
    }

    @Override
    @Transactional
    public void reorderFolders(List<Long> folderIds) {
        if (folderIds == null || folderIds.isEmpty()) return;
        User currentUser = securityUtils.getCurrentUser();
        for (int i = 0; i < folderIds.size(); i++) {
            Long folderId = folderIds.get(i);
            if (folderId == null) continue;
            Optional<NoteFolder> folderOpt = noteFolderRepository.findByIdAndUserId(folderId, currentUser.getId());
            if (folderOpt.isPresent()) {
                NoteFolder folder = folderOpt.get();
                folder.setSortOrder(i);
                noteFolderRepository.save(folder);
            }
        }
    }
}
