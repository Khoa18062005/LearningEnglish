package com.dolvocab.app.service;

import com.dolvocab.app.dto.response.WordFamilyResponse;
import com.dolvocab.app.entity.WordFamily;

import java.util.List;

public interface WordFamilyService {
    List<WordFamilyResponse> getAllWordFamilies();
    WordFamily getOrCreateWordFamily(String rootWord, String description);
}
