package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.response.WordFamilyResponse;
import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.entity.WordFamily;
import com.dolvocab.app.repository.WordFamilyRepository;
import com.dolvocab.app.service.WordFamilyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WordFamilyServiceImpl implements WordFamilyService {

    private final WordFamilyRepository wordFamilyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<WordFamilyResponse> getAllWordFamilies() {
        List<WordFamily> families = wordFamilyRepository.findAll();
        List<WordFamilyResponse> responses = new ArrayList<>();

        for (WordFamily wf : families) {
            List<String> words = wf.getVocabularies().stream()
                    .map(Vocabulary::getWord)
                    .toList();

            responses.add(WordFamilyResponse.builder()
                    .id(wf.getId())
                    .rootWord(wf.getRootWord())
                    .description(wf.getDescription())
                    .words(words)
                    .build());
        }
        return responses;
    }

    @Override
    @Transactional
    public WordFamily getOrCreateWordFamily(String rootWord, String description) {
        if (rootWord == null || rootWord.trim().isEmpty()) {
            return null;
        }

        return wordFamilyRepository.findByRootWordIgnoreCase(rootWord.trim())
                .orElseGet(() -> wordFamilyRepository.save(
                        WordFamily.builder()
                                .rootWord(rootWord.trim())
                                .description(description)
                                .build()
                ));
    }
}
