package com.dolvocab.app.repository;

import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.entity.enums.PartOfSpeech;

import java.util.List;
import java.util.Map;

public interface VocabularyQueryRepository {

    List<Vocabulary> findVocabulariesWithFilter(
            String userId,
            String cursor,
            String keyword,
            List<String> categoryIds,
            String categoryName,
            String noteListId,
            PartOfSpeech pos,
            String wordFamilyId,
            int limit
    );

    Map<String, Long> countVocabulariesGroupedByCategoryIds(String userId);

    Map<String, Long> countVocabulariesGroupedByNoteListIds(String userId);
}
