package com.dolvocab.app.service;

import com.dolvocab.app.dto.request.VocabCreateRequest;
import com.dolvocab.app.dto.response.CursorResponse;
import com.dolvocab.app.dto.response.VocabDetailResponse;

import java.util.List;

public interface VocabularyService {

    List<VocabDetailResponse> getVocabularies(
            String keyword,
            List<String> categoryIds,
            String categoryName,
            String noteListId,
            String pos,
            String wordFamilyId
    );

    CursorResponse<VocabDetailResponse> getVocabulariesCursor(
            String cursor,
            Integer limit,
            String keyword,
            List<String> categoryIds,
            String categoryName,
            String noteListId,
            String pos,
            String wordFamilyId
    );

    VocabDetailResponse getVocabById(String id);

    VocabDetailResponse createVocabulary(VocabCreateRequest request);

    VocabDetailResponse updateVocabulary(String id, VocabCreateRequest request);

    void deleteVocabulary(String id);
}
