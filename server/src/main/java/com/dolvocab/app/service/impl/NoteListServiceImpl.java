package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.NoteListCreateRequest;
import com.dolvocab.app.dto.response.NoteListResponse;
import com.dolvocab.app.entity.NoteList;
import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.repository.NoteListRepository;
import com.dolvocab.app.service.NoteListService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteListServiceImpl implements NoteListService {

    private final NoteListRepository noteListRepository;

    private NoteListResponse toResponse(NoteList list, long count) {
        String code = list.getCode();
        String title = list.getTitle();
        String shortTitle = (code != null && !code.trim().isEmpty()) ? code.trim() : title;
        String fullTitle = (code != null && !code.trim().isEmpty() && !code.trim().equalsIgnoreCase(title))
                ? code.trim() + ": " + title
                : title;

        return NoteListResponse.builder()
                .id(list.getId())
                .title(title)
                .code(code)
                .shortTitle(shortTitle)
                .fullTitle(fullTitle)
                .sourceReference(list.getSourceReference())
                .passage(list.getPassage())
                .note(list.getNote())
                .createdAt(list.getCreatedAt())
                .count(count)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteListResponse> getAllNoteLists() {
        List<Object[]> rows = noteListRepository.findNoteListsWithVocabCount();
        List<NoteListResponse> responses = new ArrayList<>();

        for (Object[] row : rows) {
            Long id = (Long) row[0];
            String title = (String) row[1];
            String code = (String) row[2];
            String source = (String) row[3];
            String passage = (String) row[4];
            String note = (String) row[5];
            LocalDateTime createdAt = (LocalDateTime) row[6];
            long count = ((Number) row[7]).longValue();

            String shortTitle = (code != null && !code.trim().isEmpty()) ? code.trim() : title;
            String fullTitle = (code != null && !code.trim().isEmpty() && !code.trim().equalsIgnoreCase(title))
                    ? code.trim() + ": " + title
                    : title;

            responses.add(NoteListResponse.builder()
                    .id(id)
                    .title(title)
                    .code(code)
                    .shortTitle(shortTitle)
                    .fullTitle(fullTitle)
                    .sourceReference(source)
                    .passage(passage)
                    .note(note)
                    .createdAt(createdAt)
                    .count(count)
                    .build());
        }
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public NoteListResponse getNoteListById(Long id) {
        NoteList list = noteListRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Reading List với ID: " + id));

        return toResponse(list, list.getVocabularies().size());
    }

    @Override
    @Transactional
    public NoteListResponse createNoteList(NoteListCreateRequest request) {
        String code = request.getCode();
        if (code == null || code.trim().isEmpty()) {
            long nextNumber = noteListRepository.count() + 1;
            code = String.format("LIST %02d", nextNumber);
        } else {
            code = code.trim();
        }

        NoteList list = NoteList.builder()
                .title(request.getTitle().trim())
                .code(code)
                .sourceReference(request.getSourceReference() != null ? request.getSourceReference().trim() : null)
                .passage(request.getPassage() != null ? request.getPassage().trim() : null)
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .build();

        NoteList saved = noteListRepository.save(list);
        return toResponse(saved, 0);
    }

    @Override
    @Transactional
    public NoteListResponse updateNoteList(Long id, NoteListCreateRequest request) {
        NoteList list = noteListRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Reading List với ID: " + id));

        list.setTitle(request.getTitle().trim());
        if (request.getCode() != null && !request.getCode().trim().isEmpty()) {
            list.setCode(request.getCode().trim());
        }
        list.setSourceReference(request.getSourceReference() != null ? request.getSourceReference().trim() : null);
        list.setPassage(request.getPassage() != null ? request.getPassage().trim() : null);
        list.setNote(request.getNote() != null ? request.getNote().trim() : null);

        NoteList saved = noteListRepository.save(list);
        return toResponse(saved, list.getVocabularies().size());
    }

    @Override
    @Transactional
    public void deleteNoteList(Long id) {
        NoteList list = noteListRepository.findById(id)
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
    public NoteList getOrCreateNoteList(String identifier, String title) {
        if (identifier != null && !identifier.trim().isEmpty()) {
            try {
                Long id = Long.parseLong(identifier.trim());
                return noteListRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {
                var byCode = noteListRepository.findByCodeIgnoreCase(identifier.trim());
                if (byCode.isPresent()) return byCode.get();

                var byTitle = noteListRepository.findByTitleIgnoreCase(identifier.trim());
                if (byTitle.isPresent()) return byTitle.get();
            }
        }

        if (title != null && !title.trim().isEmpty()) {
            return noteListRepository.findByTitleIgnoreCase(title.trim())
                    .orElseGet(() -> noteListRepository.save(
                            NoteList.builder()
                                    .title(title.trim())
                                    .code(String.format("LIST %02d", noteListRepository.count() + 1))
                                    .build()
                    ));
        }

        return null;
    }
}
