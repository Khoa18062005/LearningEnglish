package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.response.WordFamilyResponse;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.entity.WordFamily;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import com.dolvocab.app.exception.ResourceNotFoundException;
import com.dolvocab.app.repository.WordFamilyRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.WordFamilyService;
import com.dolvocab.app.utils.ObjectIdValidator;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
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
    private final MongoTemplate mongoTemplate;

    @Override
    @Transactional(readOnly = true)
    public List<WordFamilyResponse> getAllWordFamilies() {
        User currentUser = securityUtils.getCurrentUser();
        List<WordFamily> families = wordFamilyRepository.findAllByUserIdOrderByRootWordAsc(currentUser.getId());
        return families.stream().map(wf -> mapToResponse(wf, currentUser.getId())).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WordFamilyResponse> searchWordFamilies(String keyword) {
        User currentUser = securityUtils.getCurrentUser();
        List<WordFamily> families = wordFamilyRepository.findAllByUserIdOrderByRootWordAsc(currentUser.getId());
        if (keyword == null || keyword.trim().isEmpty()) {
            return families.stream().map(wf -> mapToResponse(wf, currentUser.getId())).toList();
        }

        String q = keyword.trim().toLowerCase();
        return families.stream()
                .map(wf -> mapToResponse(wf, currentUser.getId()))
                .filter(wf -> (wf.getRootWord() != null && wf.getRootWord().toLowerCase().contains(q)) ||
                        (wf.getWords() != null && wf.getWords().stream().anyMatch(w -> w != null && w.toLowerCase().contains(q))))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WordFamilyResponse getWordFamilyById(String id) {
        ObjectIdValidator.validate(id, "Word Family");
        User currentUser = securityUtils.getCurrentUser();
        WordFamily wf = wordFamilyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Word Family với ID: " + id));
        return mapToResponse(wf, currentUser.getId());
    }

    @Override
    @Transactional
    public WordFamily getOrCreateWordFamily(String rootWord, String description, User user) {
        if (rootWord == null || rootWord.trim().isEmpty()) {
            return null;
        }

        String trimmed = rootWord.trim();
        String lower = trimmed.toLowerCase();
        return wordFamilyRepository.findByRootWordLowerAndUserId(lower, user.getId())
                .orElseGet(() -> wordFamilyRepository.save(
                        WordFamily.builder()
                                .userId(user.getId())
                                .rootWord(trimmed)
                                .rootWordLower(lower)
                                .description(description)
                                .build()
                ));
    }

    @Override
    @Transactional
    public WordFamilyResponse createWordFamily(String rootWord, String description) {
        User currentUser = securityUtils.getCurrentUser();
        WordFamily wf = getOrCreateWordFamily(rootWord, description, currentUser);
        return mapToResponse(wf, currentUser.getId());
    }

    @Override
    @Transactional
    public WordFamilyResponse updateWordFamily(String id, String rootWord, String description, List<String> memberOrder) {
        ObjectIdValidator.validate(id, "Word Family");
        User currentUser = securityUtils.getCurrentUser();
        WordFamily wf = wordFamilyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Word Family với ID: " + id));

        if (rootWord != null && !rootWord.trim().isEmpty()) {
            wf.setRootWord(rootWord.trim());
            wf.setRootWordLower(rootWord.trim().toLowerCase());
        }
        if (description != null) {
            wf.setDescription(description);
        }
        if (memberOrder != null) {
            wf.setMemberOrder(memberOrder.stream()
                    .filter(org.bson.types.ObjectId::isValid)
                    .distinct()
                    .collect(java.util.stream.Collectors.toList()));
        }

        WordFamily saved = wordFamilyRepository.save(wf);
        return mapToResponse(saved, currentUser.getId());
    }

    @Override
    @Transactional
    public void deleteWordFamily(String id) {
        ObjectIdValidator.validate(id, "Word Family");
        User currentUser = securityUtils.getCurrentUser();
        WordFamily wf = wordFamilyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Word Family với ID: " + id));

        // M4-05: Cascade unset wordFamilyId on vocabularies
        Query unsetQuery = Query.query(Criteria.where("userId").is(new ObjectId(currentUser.getId()))
                .and("wordFamilyId").is(new ObjectId(id)));
        mongoTemplate.updateMulti(unsetQuery, new Update().unset("wordFamilyId"), Vocabulary.class);

        wordFamilyRepository.delete(wf);
    }

    private WordFamilyResponse mapToResponse(WordFamily wf, String userId) {
        List<String> words = new ArrayList<>();
        List<WordFamilyResponse.MemberVocabResponse> memberVocabs = new ArrayList<>();

        // Fetch vocabularies belonging to this word family
        Query vocabQuery = Query.query(Criteria.where("userId").is(new ObjectId(userId))
                .and("wordFamilyId").is(new ObjectId(wf.getId())));
        List<Vocabulary> vocabularies = mongoTemplate.find(vocabQuery, Vocabulary.class);

        for (Vocabulary v : vocabularies) {
            words.add(v.getWord());

            String pos = "v";
            String posLabel = "Verb";
            if (v.getForms() != null && !v.getForms().isEmpty()) {
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

        // Apply custom ordering if memberOrder exists
        List<String> orderList = wf.getMemberOrder();
        if (orderList != null && !orderList.isEmpty()) {
            memberVocabs.sort((a, b) -> {
                int indexA = orderList.indexOf(a.getWord());
                if (indexA == -1) indexA = orderList.indexOf(a.getId());
                int indexB = orderList.indexOf(b.getWord());
                if (indexB == -1) indexB = orderList.indexOf(b.getId());
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

        String memberOrderStr = orderList != null ? String.join(",", orderList) : "";

        return WordFamilyResponse.builder()
                .id(wf.getId())
                .rootWord(wf.getRootWord())
                .description(wf.getDescription())
                .memberOrder(memberOrderStr)
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
