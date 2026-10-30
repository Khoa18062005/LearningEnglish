package com.dolvocab.app.service;

import com.dolvocab.app.dto.request.VocabCreateRequest;
import com.dolvocab.app.dto.response.CursorResponse;
import com.dolvocab.app.dto.response.VocabDetailResponse;

import java.util.List;

public interface VocabularyService {

    List<VocabDetailResponse> getVocabularies(
            String keyword,
            List<Long> categoryIds,
            String categoryName,
            Long noteListId,
            String pos,
            Long wordFamilyId
    );

    CursorResponse<VocabDetailResponse> getVocabulariesCursor(
            Long cursor,
            Integer limit,
            String keyword,
            List<Long> categoryIds,
            String categoryName,
            Long noteListId,
            String pos,
            Long wordFamilyId
    );

    VocabDetailResponse getVocabById(Long id);

    VocabDetailResponse createVocabulary(VocabCreateRequest request);

    VocabDetailResponse updateVocabulary(Long id, VocabCreateRequest request);

    void deleteVocabulary(Long id);
}
