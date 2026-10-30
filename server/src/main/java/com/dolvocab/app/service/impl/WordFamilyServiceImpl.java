package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.response.WordFamilyResponse;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.entity.WordFamily;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import com.dolvocab.app.repository.WordFamilyRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.WordFamilyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WordFamilyServiceImpl implements WordFamilyService {

    private final WordFamilyRepository wordFamilyRepository;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional(readOnly = true)
    public List<WordFamilyResponse> getAllWordFamilies() {
        User currentUser = securityUtils.getCurrentUser();
        List<WordFamily> families = wordFamilyRepository.findAllByUserIdOrderByRootWordAsc(currentUser.getId());
        return families.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WordFamilyResponse> searchWordFamilies(String keyword) {
        User currentUser = securityUtils.getCurrentUser();
        List<WordFamily> families = wordFamilyRepository.findAllByUserIdOrderByRootWordAsc(currentUser.getId());
        if (keyword == null || keyword.trim().isEmpty()) {
            return families.stream().map(this::mapToResponse).toList();
        }

        String q = keyword.trim().toLowerCase();
        return families.stream()
                .map(this::mapToResponse)
                .filter(wf -> (wf.getRootWord() != null && wf.getRootWord().toLowerCase().contains(q)) ||
                        (wf.getWords() != null && wf.getWords().stream().anyMatch(w -> w != null && w.toLowerCase().contains(q))))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WordFamilyResponse getWordFamilyById(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        WordFamily wf = wordFamilyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Word Family với ID: " + id));
        return mapToResponse(wf);
    }

    @Override
    @Transactional
    public WordFamily getOrCreateWordFamily(String rootWord, String description, User user) {
        if (rootWord == null || rootWord.trim().isEmpty()) {
            return null;
        }

        return wordFamilyRepository.findByRootWordIgnoreCaseAndUserId(rootWord.trim(), user.getId())
                .orElseGet(() -> wordFamilyRepository.save(
                        WordFamily.builder()
                                .user(user)
                                .rootWord(rootWord.trim())
                                .description(description)
                                .build()
                ));
    }

    @Override
    @Transactional
    public WordFamilyResponse createWordFamily(String rootWord, String description) {
        User currentUser = securityUtils.getCurrentUser();
        WordFamily wf = getOrCreateWordFamily(rootWord, description, currentUser);
        return mapToResponse(wf);
    }

    @Override
    @Transactional
    public WordFamilyResponse updateWordFamily(Long id, String rootWord, String description, List<String> memberOrder) {
        User currentUser = securityUtils.getCurrentUser();
        WordFamily wf = wordFamilyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Word Family với ID: " + id));

        if (rootWord != null && !rootWord.trim().isEmpty()) {
            wf.setRootWord(rootWord.trim());
        }
        if (description != null) {
            wf.setDescription(description);
        }
        if (memberOrder != null) {
            wf.setMemberOrder(String.join(",", memberOrder));
        }

        WordFamily saved = wordFamilyRepository.save(wf);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteWordFamily(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        WordFamily wf = wordFamilyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Word Family với ID: " + id));

        if (wf.getVocabularies() != null) {
            for (Vocabulary v : wf.getVocabularies()) {
                v.setWordFamily(null);
            }
        }
        wordFamilyRepository.delete(wf);
    }

    private WordFamilyResponse mapToResponse(WordFamily wf) {
        List<String> words = new ArrayList<>();
        List<WordFamilyResponse.MemberVocabResponse> memberVocabs = new ArrayList<>();

        if (wf.getVocabularies() != null) {
            for (Vocabulary v : wf.getVocabularies()) {
                words.add(v.getWord());

                String pos = "v";
                String posLabel = "Verb";
                if (!v.getForms().isEmpty()) {
                    pos = formatPosBadge(v.getForms().get(0).getPartOfSpeech());
                    posLabel = formatPosLabel(v.getForms().get(0).getPartOfSpeech());
                }

                memberVocabs.add(WordFamilyResponse.MemberVocabResponse.builder()
                        .id(v.getId())
                        .word(v.getWord())
                        .pos(pos)
                        .posLabel(posLabel)
                        .meaning(v.getMeaning())
                        .phonetic(v.getPhonetic())
                        .build());
            }
        }

        // Apply custom ordering if memberOrder exists
        if (wf.getMemberOrder() != null && !wf.getMemberOrder().trim().isEmpty()) {
            List<String> orderList = Arrays.asList(wf.getMemberOrder().split(","));
            memberVocabs.sort((a, b) -> {
                int indexA = orderList.indexOf(a.getWord());
                int indexB = orderList.indexOf(b.getWord());
                if (indexA == -1 && indexB == -1) return 0;
                if (indexA == -1) return 1;
                if (indexB == -1) return -1;
                return Integer.compare(indexA, indexB);
            });
            words.sort((a, b) -> {
                int indexA = orderList.indexOf(a);
                int indexB = orderList.indexOf(b);
                if (indexA == -1 && indexB == -1) return 0;
                if (indexA == -1) return 1;
                if (indexB == -1) return -1;
                return Integer.compare(indexA, indexB);
            });
        }

        return WordFamilyResponse.builder()
                .id(wf.getId())
                .rootWord(wf.getRootWord())
                .description(wf.getDescription())
                .memberOrder(wf.getMemberOrder())
                .words(words)
                .memberVocabs(memberVocabs)
                .build();
    }

    private String formatPosBadge(PartOfSpeech pos) {
        if (pos == null) return "v";
        return switch (pos) {
            case N -> "n";
            case V -> "v";
            case ADJ -> "adj";
            case ADV -> "adv";
            case IDIOM -> "idiom";
            default -> pos.name().toLowerCase();
        };
    }

    private String formatPosLabel(PartOfSpeech pos) {
        if (pos == null) return "Verb";
        return switch (pos) {
            case N -> "Noun";
            case V -> "Verb";
            case ADJ -> "Adjective";
            case ADV -> "Adverb";
            case IDIOM -> "Idioms";
            default -> pos.getDescription();
        };
    }
}
