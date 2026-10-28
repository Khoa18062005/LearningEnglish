package com.dolvocab.app.service;

import com.dolvocab.app.dto.response.WordFamilyResponse;
import com.dolvocab.app.entity.WordFamily;

import java.util.List;

public interface WordFamilyService {
    List<WordFamilyResponse> getAllWordFamilies();
    List<WordFamilyResponse> searchWordFamilies(String keyword);
    WordFamilyResponse getWordFamilyById(Long id);
    WordFamily getOrCreateWordFamily(String rootWord, String description);
    WordFamilyResponse createWordFamily(String rootWord, String description);
    void deleteWordFamily(Long id);
}
